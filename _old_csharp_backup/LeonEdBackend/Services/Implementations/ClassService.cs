using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ClassDtos;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class ClassService : IClassService
    {
        private readonly AppDbContext _context;
        public ClassService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<List<ClassResponse>>> GetClasses(Guid schoolId)
        {
            var classes = await _context.Classes.Where(c => c.SchoolId == schoolId)
                .Include(c => c.Students).Include(c => c.ClassSubjects).ThenInclude(cs => cs.Subject)
                .Include(c => c.AcademicSession).OrderBy(c => c.Name).ToListAsync();
            return ApiResponse<List<ClassResponse>>.SuccessResponse(classes.Select(Map).ToList());
        }

        public async Task<ApiResponse<ClassResponse>> GetClassById(Guid schoolId, Guid classId)
        {
            var c = await _context.Classes.Include(c => c.Students).Include(c => c.ClassSubjects).ThenInclude(cs => cs.Subject).Include(c => c.AcademicSession).FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            return c == null ? ApiResponse<ClassResponse>.FailResponse("Class not found.") : ApiResponse<ClassResponse>.SuccessResponse(Map(c));
        }

        public async Task<ApiResponse<ClassResponse>> CreateClass(Guid schoolId, CreateClassRequest request)
        {
            var cls = new Class { Id = Guid.NewGuid(), SchoolId = schoolId, Name = request.Name, Arm = request.Arm, AcademicSessionId = request.AcademicSessionId, CreatedAt = DateTime.UtcNow };
            _context.Classes.Add(cls);
            await _context.SaveChangesAsync();
            return ApiResponse<ClassResponse>.SuccessResponse(Map(cls), "Class created successfully.");
        }

        public async Task<ApiResponse<ClassResponse>> UpdateClass(Guid schoolId, Guid classId, UpdateClassRequest r)
        {
            var c = await _context.Classes.Include(c => c.Students).Include(c => c.ClassSubjects).ThenInclude(cs => cs.Subject).FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (c == null) return ApiResponse<ClassResponse>.FailResponse("Class not found.");
            if (!string.IsNullOrWhiteSpace(r.Name)) c.Name = r.Name;
            if (!string.IsNullOrWhiteSpace(r.Arm)) c.Arm = r.Arm;
            await _context.SaveChangesAsync();
            return ApiResponse<ClassResponse>.SuccessResponse(Map(c), "Class updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteClass(Guid schoolId, Guid classId)
        {
            var c = await _context.Classes.Include(c => c.Students).FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (c == null) return ApiResponse<bool>.FailResponse("Class not found.");
            if (c.Students.Any()) return ApiResponse<bool>.FailResponse("Cannot delete a class with students. Reassign them first.");
            _context.Classes.Remove(c);
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Class deleted successfully.");
        }

        public async Task<ApiResponse<ClassResponse>> AssignSubjectsToClass(Guid schoolId, Guid classId, AssignSubjectsToClassRequest request)
        {
            var c = await _context.Classes.Include(c => c.ClassSubjects).ThenInclude(cs => cs.Subject).FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (c == null) return ApiResponse<ClassResponse>.FailResponse("Class not found.");

            // Remove existing and re-assign
            _context.ClassSubjects.RemoveRange(c.ClassSubjects);
            foreach (var subjectId in request.SubjectIds.Distinct())
            {
                var exists = await _context.Subjects.AnyAsync(s => s.Id == subjectId && s.SchoolId == schoolId);
                if (!exists) return ApiResponse<ClassResponse>.FailResponse($"Subject {subjectId} not found in this school.");
                c.ClassSubjects.Add(new ClassSubject { Id = Guid.NewGuid(), ClassId = classId, SubjectId = subjectId, CreatedAt = DateTime.UtcNow });
            }
            await _context.SaveChangesAsync();

            // Reload
            c = await _context.Classes.Include(c => c.Students).Include(c => c.ClassSubjects).ThenInclude(cs => cs.Subject).Include(c => c.AcademicSession).FirstAsync(c => c.Id == classId);
            return ApiResponse<ClassResponse>.SuccessResponse(Map(c), "Subjects assigned to class successfully.");
        }

        private static ClassResponse Map(Class c) => new()
        { Id = c.Id, Name = c.Name, Arm = c.Arm, StudentCount = c.Students?.Count ?? 0, AcademicSessionId = c.AcademicSessionId, AcademicSessionName = c.AcademicSession?.Name, Subjects = c.ClassSubjects?.Select(cs => new ClassSubjectResponse { SubjectId = cs.SubjectId, SubjectName = cs.Subject?.Name ?? "" }).ToList() ?? new(), CreatedAt = c.CreatedAt };
    }
}
