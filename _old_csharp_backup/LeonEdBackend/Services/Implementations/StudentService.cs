using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.StudentDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class StudentService : IStudentService
    {
        private readonly AppDbContext _context;
        public StudentService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<PagedResult<StudentResponse>>> GetStudents(Guid schoolId, PaginationParams p)
        {
            var q = _context.Students
                .Where(s => s.SchoolId == schoolId)
                .Include(s => s.Class)
                .Include(s => s.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(p.Search))
            {
                var search = p.Search.ToLower();
                q = q.Where(s => s.FullName.ToLower().Contains(search) || s.AdmissionNumber.ToLower().Contains(search));
            }

            var total = await q.CountAsync();
            var items = await q.OrderByDescending(s => s.EnrolledAt).Skip((p.PageNumber - 1) * p.PageSize).Take(p.PageSize).ToListAsync();

            return ApiResponse<PagedResult<StudentResponse>>.SuccessResponse(new PagedResult<StudentResponse>
            { Items = items.Select(Map).ToList(), TotalCount = total, PageNumber = p.PageNumber, PageSize = p.PageSize });
        }

        public async Task<ApiResponse<StudentResponse>> GetStudentById(Guid schoolId, Guid studentId)
        {
            var s = await _context.Students
                .Include(s => s.Class)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);

            return s == null ? ApiResponse<StudentResponse>.FailResponse("Student not found.") : ApiResponse<StudentResponse>.SuccessResponse(Map(s));
        }

        public async Task<ApiResponse<StudentResponse>> CreateStudent(Guid schoolId, CreateStudentRequest request)
        {
            var school = await _context.Schools.Include(s => s.Students).FirstOrDefaultAsync(s => s.Id == schoolId);
            if (school == null) return ApiResponse<StudentResponse>.FailResponse("School not found.");

            var activeCount = school.Students.Count(s => s.Status == StudentStatus.Active);
            if (activeCount >= school.MaxStudents)
                return ApiResponse<StudentResponse>.FailResponse($"Student limit reached. Your {school.SubscriptionPlan} plan allows max {school.MaxStudents} students. Upgrade your plan.");

            var admNo = request.AdmissionNumber;
            if (string.IsNullOrWhiteSpace(admNo)) { var c = await _context.Students.CountAsync(s => s.SchoolId == schoolId); admNo = $"ADM/{DateTime.UtcNow.Year}/{(c + 1):D4}"; }
            else if (await _context.Students.AnyAsync(s => s.SchoolId == schoolId && s.AdmissionNumber == admNo))
                return ApiResponse<StudentResponse>.FailResponse("Admission number already exists in this school.");

            // Create User Account for the student
            var systemEmail = $"{admNo.Replace("/", "").ToLower()}@{school.Slug}.leoned.com";
            
            // Just in case the generated email clashes
            if (await _context.Users.AnyAsync(u => u.Email == systemEmail))
            {
                systemEmail = $"{admNo.Replace("/", "").ToLower()}{Guid.NewGuid().ToString()[..4]}@{school.Slug}.leoned.com";
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                SchoolId = schoolId,
                Name = request.FullName,
                Email = systemEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123!"), // Default password
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var student = new Student 
            { 
                Id = Guid.NewGuid(), 
                SchoolId = schoolId, 
                UserId = user.Id,
                FullName = request.FullName, 
                AdmissionNumber = admNo, 
                Gender = request.Gender, 
                DateOfBirth = request.DateOfBirth, 
                ClassId = request.ClassId, 
                ParentName = request.ParentName, 
                ParentPhone = request.ParentPhone, 
                ParentEmail = request.ParentEmail, 
                Status = StudentStatus.Active, 
                EnrolledAt = DateTime.UtcNow 
            };

            _context.Users.Add(user);
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            
            var created = await _context.Students.Include(s => s.Class).Include(s => s.User).FirstAsync(s => s.Id == student.Id);
            return ApiResponse<StudentResponse>.SuccessResponse(Map(created), "Student created successfully.");
        }

        public async Task<ApiResponse<StudentResponse>> UpdateStudent(Guid schoolId, Guid studentId, UpdateStudentRequest r)
        {
            var s = await _context.Students.Include(s => s.Class).Include(s => s.User).FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);
            if (s == null) return ApiResponse<StudentResponse>.FailResponse("Student not found.");
            
            if (!string.IsNullOrWhiteSpace(r.FullName)) 
            {
                s.FullName = r.FullName;
                if (s.User != null) s.User.Name = r.FullName;
            }
            if (r.Gender.HasValue) s.Gender = r.Gender.Value;
            if (r.DateOfBirth.HasValue) s.DateOfBirth = r.DateOfBirth;
            if (r.ClassId.HasValue) s.ClassId = r.ClassId;
            if (!string.IsNullOrWhiteSpace(r.ParentName)) s.ParentName = r.ParentName;
            if (!string.IsNullOrWhiteSpace(r.ParentPhone)) s.ParentPhone = r.ParentPhone;
            if (!string.IsNullOrWhiteSpace(r.ParentEmail)) s.ParentEmail = r.ParentEmail;
            
            if (r.Status.HasValue) 
            {
                s.Status = r.Status.Value;
                if (s.User != null)
                {
                    s.User.IsActive = (s.Status == StudentStatus.Active);
                }
            }
            
            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ApiResponse<StudentResponse>.SuccessResponse(Map(s), "Student updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteStudent(Guid schoolId, Guid studentId)
        {
            var s = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);
            if (s == null) return ApiResponse<bool>.FailResponse("Student not found.");
            
            s.Status = StudentStatus.Archived; 
            s.UpdatedAt = DateTime.UtcNow;
            
            if (s.User != null)
            {
                s.User.IsActive = false; // Disable user login
            }

            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Student archived successfully.");
        }

        public async Task<ApiResponse<List<StudentResponse>>> SearchStudents(Guid schoolId, string query)
        {
            var search = query.ToLower();
            var list = await _context.Students
                .Where(s => s.SchoolId == schoolId && (s.FullName.ToLower().Contains(search) || s.AdmissionNumber.ToLower().Contains(search)))
                .Include(s => s.Class)
                .Include(s => s.User)
                .Take(20).ToListAsync();
            return ApiResponse<List<StudentResponse>>.SuccessResponse(list.Select(Map).ToList());
        }

        private static StudentResponse Map(Student s) => new()
        { 
            Id = s.Id, 
            FullName = s.FullName, 
            AdmissionNumber = s.AdmissionNumber, 
            Gender = s.Gender.ToString(), 
            DateOfBirth = s.DateOfBirth, 
            ParentName = s.ParentName, 
            ParentPhone = s.ParentPhone, 
            ParentEmail = s.ParentEmail, 
            Status = s.Status.ToString(), 
            ClassId = s.ClassId, 
            ClassName = s.Class != null ? $"{s.Class.Name} {s.Class.Arm}".Trim() : null, 
            EnrolledAt = s.EnrolledAt,
            SystemEmail = s.User?.Email 
        };
    }
}
