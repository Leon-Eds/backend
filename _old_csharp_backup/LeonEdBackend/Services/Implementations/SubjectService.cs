using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SubjectDtos;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class SubjectService : ISubjectService
    {
        private readonly AppDbContext _context;
        public SubjectService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<List<SubjectResponse>>> GetSubjects(Guid schoolId)
        {
            var subjects = await _context.Subjects.Where(s => s.SchoolId == schoolId)
                .Include(s => s.ClassSubjects).OrderBy(s => s.Name).ToListAsync();
            return ApiResponse<List<SubjectResponse>>.SuccessResponse(subjects.Select(s => new SubjectResponse
            { Id = s.Id, Name = s.Name, ClassCount = s.ClassSubjects.Count, CreatedAt = s.CreatedAt }).ToList());
        }

        public async Task<ApiResponse<SubjectResponse>> CreateSubject(Guid schoolId, CreateSubjectRequest request)
        {
            if (await _context.Subjects.AnyAsync(s => s.SchoolId == schoolId && s.Name.ToLower() == request.Name.ToLower()))
                return ApiResponse<SubjectResponse>.FailResponse("Subject already exists in this school.");

            var subject = new Subject { Id = Guid.NewGuid(), SchoolId = schoolId, Name = request.Name, CreatedAt = DateTime.UtcNow };
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();
            return ApiResponse<SubjectResponse>.SuccessResponse(new SubjectResponse { Id = subject.Id, Name = subject.Name, ClassCount = 0, CreatedAt = subject.CreatedAt }, "Subject created successfully.");
        }

        public async Task<ApiResponse<SubjectResponse>> UpdateSubject(Guid schoolId, Guid subjectId, UpdateSubjectRequest request)
        {
            var s = await _context.Subjects.Include(s => s.ClassSubjects).FirstOrDefaultAsync(s => s.Id == subjectId && s.SchoolId == schoolId);
            if (s == null) return ApiResponse<SubjectResponse>.FailResponse("Subject not found.");
            if (await _context.Subjects.AnyAsync(x => x.SchoolId == schoolId && x.Id != subjectId && x.Name.ToLower() == request.Name.ToLower()))
                return ApiResponse<SubjectResponse>.FailResponse("Another subject with this name already exists.");
            s.Name = request.Name;
            await _context.SaveChangesAsync();
            return ApiResponse<SubjectResponse>.SuccessResponse(new SubjectResponse { Id = s.Id, Name = s.Name, ClassCount = s.ClassSubjects.Count, CreatedAt = s.CreatedAt }, "Subject updated successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteSubject(Guid schoolId, Guid subjectId)
        {
            var s = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == subjectId && s.SchoolId == schoolId);
            if (s == null) return ApiResponse<bool>.FailResponse("Subject not found.");
            _context.Subjects.Remove(s);
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Subject deleted successfully.");
        }
    }
}
