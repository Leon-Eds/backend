using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.TeacherDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class TeacherService : ITeacherService
    {
        private readonly AppDbContext _context;
        public TeacherService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<PagedResult<TeacherResponse>>> GetTeachers(Guid schoolId, PaginationParams p)
        {
            var q = _context.Teachers.Where(t => t.SchoolId == schoolId).Include(t => t.SubjectAssignments).ThenInclude(a => a.Subject).Include(t => t.SubjectAssignments).ThenInclude(a => a.Class).AsQueryable();
            if (!string.IsNullOrWhiteSpace(p.Search)) { var s = p.Search.ToLower(); q = q.Where(t => t.FullName.ToLower().Contains(s) || t.Email.ToLower().Contains(s)); }
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(t => t.CreatedAt).Skip((p.PageNumber - 1) * p.PageSize).Take(p.PageSize).ToListAsync();
            return ApiResponse<PagedResult<TeacherResponse>>.SuccessResponse(new PagedResult<TeacherResponse>
            { Items = items.Select(Map).ToList(), TotalCount = total, PageNumber = p.PageNumber, PageSize = p.PageSize });
        }

        public async Task<ApiResponse<TeacherResponse>> GetTeacherById(Guid schoolId, Guid teacherId)
        {
            var t = await _context.Teachers.Include(t => t.SubjectAssignments).ThenInclude(a => a.Subject).Include(t => t.SubjectAssignments).ThenInclude(a => a.Class).FirstOrDefaultAsync(t => t.Id == teacherId && t.SchoolId == schoolId);
            return t == null ? ApiResponse<TeacherResponse>.FailResponse("Teacher not found.") : ApiResponse<TeacherResponse>.SuccessResponse(Map(t));
        }

        public async Task<ApiResponse<TeacherResponse>> CreateTeacher(Guid schoolId, CreateTeacherRequest request)
        {
            var school = await _context.Schools.Include(s => s.Teachers).FirstOrDefaultAsync(s => s.Id == schoolId);
            if (school == null) return ApiResponse<TeacherResponse>.FailResponse("School not found.");

            var activeCount = school.Teachers.Count(t => t.IsActive);
            if (activeCount >= school.MaxTeachers)
                return ApiResponse<TeacherResponse>.FailResponse($"Teacher limit reached. Your {school.SubscriptionPlan} plan allows max {school.MaxTeachers} teachers. Upgrade your plan.");

            if (await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
                return ApiResponse<TeacherResponse>.FailResponse("Email already in use.");

            var user = new User { Id = Guid.NewGuid(), SchoolId = schoolId, Name = request.FullName, Email = request.Email.ToLower(), PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), Role = UserRole.Teacher, IsActive = true, CreatedAt = DateTime.UtcNow };
            var teacher = new Teacher { Id = Guid.NewGuid(), SchoolId = schoolId, UserId = user.Id, FullName = request.FullName, Email = request.Email.ToLower(), Phone = request.Phone, IsActive = true, CreatedAt = DateTime.UtcNow };

            _context.Users.Add(user);
            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();
            return ApiResponse<TeacherResponse>.SuccessResponse(Map(teacher), "Teacher created successfully.");
        }

        public async Task<ApiResponse<TeacherResponse>> UpdateTeacher(Guid schoolId, Guid teacherId, UpdateTeacherRequest r)
        {
            var t = await _context.Teachers.Include(t => t.SubjectAssignments).ThenInclude(a => a.Subject).Include(t => t.SubjectAssignments).ThenInclude(a => a.Class).FirstOrDefaultAsync(t => t.Id == teacherId && t.SchoolId == schoolId);
            if (t == null) return ApiResponse<TeacherResponse>.FailResponse("Teacher not found.");
            if (!string.IsNullOrWhiteSpace(r.FullName)) { t.FullName = r.FullName; var u = await _context.Users.FindAsync(t.UserId); if (u != null) u.Name = r.FullName; }
            if (!string.IsNullOrWhiteSpace(r.Phone)) t.Phone = r.Phone;
            t.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ApiResponse<TeacherResponse>.SuccessResponse(Map(t), "Teacher updated successfully.");
        }

        public async Task<ApiResponse<bool>> UpdateTeacherStatus(Guid schoolId, Guid teacherId, bool isActive)
        {
            var t = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == teacherId && t.SchoolId == schoolId);
            if (t == null) return ApiResponse<bool>.FailResponse("Teacher not found.");
            t.IsActive = isActive; t.UpdatedAt = DateTime.UtcNow;
            var u = await _context.Users.FindAsync(t.UserId);
            if (u != null) u.IsActive = isActive;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, isActive ? "Teacher activated." : "Teacher deactivated.");
        }

        public async Task<ApiResponse<TeacherAssignmentResponse>> AssignTeacher(Guid schoolId, Guid teacherId, AssignTeacherRequest r)
        {
            var t = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == teacherId && t.SchoolId == schoolId);
            if (t == null) return ApiResponse<TeacherAssignmentResponse>.FailResponse("Teacher not found.");
            var subj = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == r.SubjectId && s.SchoolId == schoolId);
            if (subj == null) return ApiResponse<TeacherAssignmentResponse>.FailResponse("Subject not found.");
            var cls = await _context.Classes.FirstOrDefaultAsync(c => c.Id == r.ClassId && c.SchoolId == schoolId);
            if (cls == null) return ApiResponse<TeacherAssignmentResponse>.FailResponse("Class not found.");
            if (await _context.TeacherSubjectAssignments.AnyAsync(a => a.TeacherId == teacherId && a.SubjectId == r.SubjectId && a.ClassId == r.ClassId))
                return ApiResponse<TeacherAssignmentResponse>.FailResponse("This assignment already exists.");

            var assignment = new TeacherSubjectAssignment { Id = Guid.NewGuid(), TeacherId = teacherId, SubjectId = r.SubjectId, ClassId = r.ClassId, CreatedAt = DateTime.UtcNow };
            _context.TeacherSubjectAssignments.Add(assignment);
            await _context.SaveChangesAsync();
            return ApiResponse<TeacherAssignmentResponse>.SuccessResponse(new TeacherAssignmentResponse { Id = assignment.Id, SubjectId = subj.Id, SubjectName = subj.Name, ClassId = cls.Id, ClassName = $"{cls.Name} {cls.Arm}".Trim() }, "Teacher assigned successfully.");
        }

        public async Task<ApiResponse<bool>> RemoveAssignment(Guid schoolId, Guid assignmentId)
        {
            var a = await _context.TeacherSubjectAssignments.Include(a => a.Teacher).FirstOrDefaultAsync(a => a.Id == assignmentId && a.Teacher.SchoolId == schoolId);
            if (a == null) return ApiResponse<bool>.FailResponse("Assignment not found.");
            _context.TeacherSubjectAssignments.Remove(a);
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Assignment removed.");
        }

        private static TeacherResponse Map(Teacher t) => new()
        { Id = t.Id, UserId = t.UserId, FullName = t.FullName, Email = t.Email, Phone = t.Phone, IsActive = t.IsActive, CreatedAt = t.CreatedAt, Assignments = t.SubjectAssignments.Select(a => new TeacherAssignmentResponse { Id = a.Id, SubjectId = a.SubjectId, SubjectName = a.Subject?.Name ?? "", ClassId = a.ClassId, ClassName = a.Class != null ? $"{a.Class.Name} {a.Class.Arm}".Trim() : "" }).ToList() };
    }
}
