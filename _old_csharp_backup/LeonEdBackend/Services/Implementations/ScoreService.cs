using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ScoreDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class ScoreService : IScoreService
    {
        private readonly AppDbContext _context;
        private readonly IGradingService _gradingService;

        public ScoreService(AppDbContext context, IGradingService gradingService)
        {
            _context = context;
            _gradingService = gradingService;
        }

        public async Task<ApiResponse<ScoreResponse>> EnterScore(Guid schoolId, Guid teacherId, EnterScoreRequest request)
        {
            // Validate student belongs to school
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == request.StudentId && s.SchoolId == schoolId);
            if (student == null)
                return ApiResponse<ScoreResponse>.FailResponse("Student not found in this school.");

            // Validate subject belongs to school
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.Id == request.SubjectId && s.SchoolId == schoolId);
            if (subject == null)
                return ApiResponse<ScoreResponse>.FailResponse("Subject not found in this school.");

            // Compute total and grade
            var total = request.FirstCA + request.SecondCA + request.Exam;
            var grade = await _gradingService.GetGrade(schoolId, total);

            // Check if score already exists (upsert)
            var existing = await _context.Scores
                .FirstOrDefaultAsync(s =>
                    s.SchoolId == schoolId &&
                    s.StudentId == request.StudentId &&
                    s.SubjectId == request.SubjectId &&
                    s.TermId == request.TermId);

            if (existing != null)
            {
                existing.FirstCA = request.FirstCA;
                existing.SecondCA = request.SecondCA;
                existing.Exam = request.Exam;
                existing.Total = total;
                existing.Grade = grade;
                existing.Remark = request.Remark;
                existing.EnteredByTeacherId = teacherId;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new Score
                {
                    Id = Guid.NewGuid(),
                    SchoolId = schoolId,
                    StudentId = request.StudentId,
                    SubjectId = request.SubjectId,
                    ClassId = request.ClassId,
                    TermId = request.TermId,
                    AcademicSessionId = request.AcademicSessionId,
                    FirstCA = request.FirstCA,
                    SecondCA = request.SecondCA,
                    Exam = request.Exam,
                    Total = total,
                    Grade = grade,
                    Remark = request.Remark,
                    EnteredByTeacherId = teacherId
                };
                _context.Scores.Add(existing);
            }

            await _context.SaveChangesAsync();

            return ApiResponse<ScoreResponse>.SuccessResponse(new ScoreResponse
            {
                Id = existing.Id,
                StudentId = student.Id,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                SubjectId = subject.Id,
                SubjectName = subject.Name,
                FirstCA = existing.FirstCA,
                SecondCA = existing.SecondCA,
                Exam = existing.Exam,
                Total = existing.Total,
                Grade = existing.Grade.ToString(),
                Remark = existing.Remark
            }, "Score entered successfully.");
        }

        public async Task<ApiResponse<List<ScoreResponse>>> BulkEnterScores(Guid schoolId, Guid teacherId, BulkEnterScoresRequest request)
        {
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.Id == request.SubjectId && s.SchoolId == schoolId);
            if (subject == null)
                return ApiResponse<List<ScoreResponse>>.FailResponse("Subject not found in this school.");

            var responses = new List<ScoreResponse>();

            foreach (var entry in request.Scores)
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.Id == entry.StudentId && s.SchoolId == schoolId);
                if (student == null) continue;

                var total = entry.FirstCA + entry.SecondCA + entry.Exam;
                var grade = await _gradingService.GetGrade(schoolId, total);

                var existing = await _context.Scores
                    .FirstOrDefaultAsync(s =>
                        s.SchoolId == schoolId &&
                        s.StudentId == entry.StudentId &&
                        s.SubjectId == request.SubjectId &&
                        s.TermId == request.TermId);

                if (existing != null)
                {
                    existing.FirstCA = entry.FirstCA;
                    existing.SecondCA = entry.SecondCA;
                    existing.Exam = entry.Exam;
                    existing.Total = total;
                    existing.Grade = grade;
                    existing.Remark = entry.Remark;
                    existing.EnteredByTeacherId = teacherId;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    existing = new Score
                    {
                        Id = Guid.NewGuid(),
                        SchoolId = schoolId,
                        StudentId = entry.StudentId,
                        SubjectId = request.SubjectId,
                        ClassId = request.ClassId,
                        TermId = request.TermId,
                        AcademicSessionId = request.AcademicSessionId,
                        FirstCA = entry.FirstCA,
                        SecondCA = entry.SecondCA,
                        Exam = entry.Exam,
                        Total = total,
                        Grade = grade,
                        Remark = entry.Remark,
                        EnteredByTeacherId = teacherId
                    };
                    _context.Scores.Add(existing);
                }

                responses.Add(new ScoreResponse
                {
                    Id = existing.Id,
                    StudentId = student.Id,
                    StudentName = student.FullName,
                    AdmissionNumber = student.AdmissionNumber,
                    SubjectId = subject.Id,
                    SubjectName = subject.Name,
                    FirstCA = existing.FirstCA,
                    SecondCA = existing.SecondCA,
                    Exam = existing.Exam,
                    Total = existing.Total,
                    Grade = existing.Grade.ToString(),
                    Remark = existing.Remark
                });
            }

            await _context.SaveChangesAsync();

            return ApiResponse<List<ScoreResponse>>.SuccessResponse(responses, $"{responses.Count} scores entered successfully.");
        }

        public async Task<ApiResponse<ClassScoreSheetResponse>> GetClassScoreSheet(Guid schoolId, Guid classId, Guid subjectId, Guid termId)
        {
            var classEntity = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (classEntity == null)
                return ApiResponse<ClassScoreSheetResponse>.FailResponse("Class not found.");

            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.Id == subjectId && s.SchoolId == schoolId);
            if (subject == null)
                return ApiResponse<ClassScoreSheetResponse>.FailResponse("Subject not found.");

            var term = await _context.Terms
                .Include(t => t.AcademicSession)
                .FirstOrDefaultAsync(t => t.Id == termId);
            if (term == null)
                return ApiResponse<ClassScoreSheetResponse>.FailResponse("Term not found.");

            var scores = await _context.Scores
                .Include(s => s.Student)
                .Where(s => s.SchoolId == schoolId && s.ClassId == classId && s.SubjectId == subjectId && s.TermId == termId)
                .OrderBy(s => s.Student.FullName)
                .ToListAsync();

            return ApiResponse<ClassScoreSheetResponse>.SuccessResponse(new ClassScoreSheetResponse
            {
                ClassId = classEntity.Id,
                ClassName = $"{classEntity.Name} {classEntity.Arm}".Trim(),
                SubjectId = subject.Id,
                SubjectName = subject.Name,
                TermName = term.TermNumber.ToString(),
                SessionName = term.AcademicSession.Name,
                Scores = scores.Select(s => new ScoreResponse
                {
                    Id = s.Id,
                    StudentId = s.StudentId,
                    StudentName = s.Student.FullName,
                    AdmissionNumber = s.Student.AdmissionNumber,
                    SubjectId = s.SubjectId,
                    SubjectName = subject.Name,
                    FirstCA = s.FirstCA,
                    SecondCA = s.SecondCA,
                    Exam = s.Exam,
                    Total = s.Total,
                    Grade = s.Grade.ToString(),
                    Remark = s.Remark
                }).ToList()
            }, "Score sheet retrieved.");
        }

        public async Task<ApiResponse<List<ScoreResponse>>> GetStudentScores(Guid schoolId, Guid studentId, Guid termId)
        {
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Id == studentId && s.SchoolId == schoolId);
            if (student == null)
                return ApiResponse<List<ScoreResponse>>.FailResponse("Student not found.");

            var scores = await _context.Scores
                .Include(s => s.Subject)
                .Where(s => s.SchoolId == schoolId && s.StudentId == studentId && s.TermId == termId)
                .OrderBy(s => s.Subject.Name)
                .ToListAsync();

            var response = scores.Select(s => new ScoreResponse
            {
                Id = s.Id,
                StudentId = s.StudentId,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                SubjectId = s.SubjectId,
                SubjectName = s.Subject.Name,
                FirstCA = s.FirstCA,
                SecondCA = s.SecondCA,
                Exam = s.Exam,
                Total = s.Total,
                Grade = s.Grade.ToString(),
                Remark = s.Remark
            }).ToList();

            return ApiResponse<List<ScoreResponse>>.SuccessResponse(response, "Student scores retrieved.");
        }
    }
}
