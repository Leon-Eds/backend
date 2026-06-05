using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ResultDtos;
using LeonEdBackend.DTOs.ScoreDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class ResultService : IResultService
    {
        private readonly AppDbContext _context;
        private readonly IFeeService _feeService;

        public ResultService(AppDbContext context, IFeeService feeService)
        {
            _context = context;
            _feeService = feeService;
        }

        public async Task<ApiResponse<ClassResultSummaryResponse>> ComputeClassResults(Guid schoolId, Guid classId, Guid termId)
        {
            var classEntity = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (classEntity == null)
                return ApiResponse<ClassResultSummaryResponse>.FailResponse("Class not found.");

            var term = await _context.Terms
                .Include(t => t.AcademicSession)
                .FirstOrDefaultAsync(t => t.Id == termId);
            if (term == null)
                return ApiResponse<ClassResultSummaryResponse>.FailResponse("Term not found.");

            // Get all students in the class
            var students = await _context.Students
                .Where(s => s.SchoolId == schoolId && s.ClassId == classId && s.Status == StudentStatus.Active)
                .ToListAsync();

            if (!students.Any())
                return ApiResponse<ClassResultSummaryResponse>.FailResponse("No active students in this class.");

            // Get all scores for this class+term
            var allScores = await _context.Scores
                .Where(s => s.SchoolId == schoolId && s.ClassId == classId && s.TermId == termId)
                .ToListAsync();

            // Build result data per student
            var studentResults = new List<(Guid StudentId, decimal TotalScore, decimal Average, int SubjectCount)>();

            foreach (var student in students)
            {
                var studentScores = allScores.Where(s => s.StudentId == student.Id).ToList();
                if (!studentScores.Any()) continue;

                var totalScore = studentScores.Sum(s => s.Total);
                var average = Math.Round(totalScore / studentScores.Count, 2);

                studentResults.Add((student.Id, totalScore, average, studentScores.Count));
            }

            // Calculate positions (rank by average, descending)
            var ranked = studentResults
                .OrderByDescending(r => r.Average)
                .ToList();

            int position = 0;
            decimal lastAverage = -1;

            for (int i = 0; i < ranked.Count; i++)
            {
                if (ranked[i].Average != lastAverage)
                {
                    position = i + 1;
                    lastAverage = ranked[i].Average;
                }

                var studentData = ranked[i];

                // Upsert result
                var existingResult = await _context.Results
                    .FirstOrDefaultAsync(r =>
                        r.SchoolId == schoolId &&
                        r.StudentId == studentData.StudentId &&
                        r.TermId == termId);

                if (existingResult != null)
                {
                    existingResult.TotalScore = studentData.TotalScore;
                    existingResult.Average = studentData.Average;
                    existingResult.Position = position;
                    existingResult.SubjectCount = studentData.SubjectCount;
                    existingResult.Status = ResultStatus.Draft;
                    existingResult.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.Results.Add(new Result
                    {
                        Id = Guid.NewGuid(),
                        SchoolId = schoolId,
                        StudentId = studentData.StudentId,
                        ClassId = classId,
                        TermId = termId,
                        AcademicSessionId = term.AcademicSessionId,
                        TotalScore = studentData.TotalScore,
                        Average = studentData.Average,
                        Position = position,
                        SubjectCount = studentData.SubjectCount,
                        Status = ResultStatus.Draft
                    });
                }
            }

            await _context.SaveChangesAsync();

            return await GetClassResults(schoolId, classId, termId);
        }

        public async Task<ApiResponse<bool>> SubmitResults(Guid schoolId, Guid classId, Guid termId, SubmitResultRequest request)
        {
            var results = await _context.Results
                .Where(r => r.SchoolId == schoolId && r.ClassId == classId && r.TermId == termId)
                .ToListAsync();

            if (!results.Any())
                return ApiResponse<bool>.FailResponse("No results found. Please compute results first.");

            foreach (var result in results)
            {
                if (result.Status == ResultStatus.Draft)
                {
                    result.Status = ResultStatus.Submitted;
                    result.TeacherComment = request.TeacherComment;
                    result.SubmittedAt = DateTime.UtcNow;
                    result.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Results submitted for approval.");
        }

        public async Task<ApiResponse<bool>> ApproveResults(Guid schoolId, Guid classId, Guid termId, ApproveResultRequest request)
        {
            var results = await _context.Results
                .Where(r => r.SchoolId == schoolId && r.ClassId == classId && r.TermId == termId && r.Status == ResultStatus.Submitted)
                .ToListAsync();

            if (!results.Any())
                return ApiResponse<bool>.FailResponse("No submitted results found for approval.");

            foreach (var result in results)
            {
                if (request.Approve)
                {
                    result.Status = ResultStatus.Approved;
                    result.AdminComment = request.AdminComment;
                    result.ApprovedAt = DateTime.UtcNow;
                }
                else
                {
                    result.Status = ResultStatus.Draft; // Reject back to draft
                    result.AdminComment = request.AdminComment;
                }
                result.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, request.Approve ? "Results approved." : "Results rejected and sent back to draft.");
        }

        public async Task<ApiResponse<bool>> PublishResults(Guid schoolId, Guid classId, Guid termId)
        {
            var results = await _context.Results
                .Where(r => r.SchoolId == schoolId && r.ClassId == classId && r.TermId == termId && r.Status == ResultStatus.Approved)
                .ToListAsync();

            if (!results.Any())
                return ApiResponse<bool>.FailResponse("No approved results found to publish.");

            foreach (var result in results)
            {
                result.Status = ResultStatus.Published;
                result.PublishedAt = DateTime.UtcNow;
                result.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Results published. Students can now view their results.");
        }

        public async Task<ApiResponse<ClassResultSummaryResponse>> GetClassResults(Guid schoolId, Guid classId, Guid termId)
        {
            var classEntity = await _context.Classes
                .FirstOrDefaultAsync(c => c.Id == classId && c.SchoolId == schoolId);
            if (classEntity == null)
                return ApiResponse<ClassResultSummaryResponse>.FailResponse("Class not found.");

            var term = await _context.Terms
                .Include(t => t.AcademicSession)
                .FirstOrDefaultAsync(t => t.Id == termId);
            if (term == null)
                return ApiResponse<ClassResultSummaryResponse>.FailResponse("Term not found.");

            var results = await _context.Results
                .Include(r => r.Student)
                .Where(r => r.SchoolId == schoolId && r.ClassId == classId && r.TermId == termId)
                .OrderBy(r => r.Position)
                .ToListAsync();

            var statusGroup = results.FirstOrDefault()?.Status.ToString() ?? "N/A";

            return ApiResponse<ClassResultSummaryResponse>.SuccessResponse(new ClassResultSummaryResponse
            {
                ClassId = classEntity.Id,
                ClassName = $"{classEntity.Name} {classEntity.Arm}".Trim(),
                TermName = term.TermNumber.ToString(),
                SessionName = term.AcademicSession.Name,
                Status = statusGroup,
                TotalStudents = results.Count,
                ClassAverage = results.Any() ? Math.Round(results.Average(r => r.Average), 2) : 0,
                Students = results.Select(r => new StudentResultSummary
                {
                    StudentId = r.StudentId,
                    StudentName = r.Student.FullName,
                    AdmissionNumber = r.Student.AdmissionNumber,
                    TotalScore = r.TotalScore,
                    Average = r.Average,
                    Position = r.Position,
                    SubjectCount = r.SubjectCount,
                    Status = r.Status.ToString()
                }).ToList()
            }, "Class results retrieved.");
        }

        public async Task<ApiResponse<StudentResultResponse>> GetStudentResult(Guid schoolId, Guid studentId, Guid termId)
        {
            var result = await _context.Results
                .Include(r => r.Student)
                .Include(r => r.Class)
                .Include(r => r.Term).ThenInclude(t => t.AcademicSession)
                .FirstOrDefaultAsync(r => r.SchoolId == schoolId && r.StudentId == studentId && r.TermId == termId);

            if (result == null)
                return ApiResponse<StudentResultResponse>.FailResponse("Result not found.");

            var totalInClass = await _context.Results
                .CountAsync(r => r.SchoolId == schoolId && r.ClassId == result.ClassId && r.TermId == termId);

            var scores = await _context.Scores
                .Include(s => s.Subject)
                .Where(s => s.SchoolId == schoolId && s.StudentId == studentId && s.TermId == termId)
                .OrderBy(s => s.Subject.Name)
                .ToListAsync();

            return ApiResponse<StudentResultResponse>.SuccessResponse(new StudentResultResponse
            {
                ResultId = result.Id,
                StudentId = result.StudentId,
                StudentName = result.Student.FullName,
                AdmissionNumber = result.Student.AdmissionNumber,
                ClassName = $"{result.Class.Name} {result.Class.Arm}".Trim(),
                TermName = result.Term.TermNumber.ToString(),
                SessionName = result.Term.AcademicSession.Name,
                TotalScore = result.TotalScore,
                Average = result.Average,
                Position = result.Position,
                SubjectCount = result.SubjectCount,
                TotalStudentsInClass = totalInClass,
                Status = result.Status.ToString(),
                TeacherComment = result.TeacherComment,
                AdminComment = result.AdminComment,
                SubjectScores = scores.Select(s => new ScoreResponse
                {
                    Id = s.Id,
                    StudentId = s.StudentId,
                    StudentName = result.Student.FullName,
                    AdmissionNumber = result.Student.AdmissionNumber,
                    SubjectId = s.SubjectId,
                    SubjectName = s.Subject.Name,
                    FirstCA = s.FirstCA,
                    SecondCA = s.SecondCA,
                    Exam = s.Exam,
                    Total = s.Total,
                    Grade = s.Grade.ToString(),
                    Remark = s.Remark
                }).ToList()
            }, "Student result retrieved.");
        }

        public async Task<ApiResponse<StudentResultCheckResponse>> CheckMyResult(Guid schoolId, Guid userId, Guid termId)
        {
            // Find the student associated with this user
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.UserId == userId);
            if (student == null)
                return ApiResponse<StudentResultCheckResponse>.FailResponse("Student profile not found.");

            // Check if result exists and is published
            var result = await _context.Results
                .FirstOrDefaultAsync(r => r.SchoolId == schoolId && r.StudentId == student.Id && r.TermId == termId);

            if (result == null || result.Status != ResultStatus.Published)
            {
                return ApiResponse<StudentResultCheckResponse>.SuccessResponse(new StudentResultCheckResponse
                {
                    IsFeesCleared = false,
                    Message = "Results have not been published yet for this term.",
                    Result = null
                }, "Results not yet available.");
            }

            // Check fee clearance
            var isCleared = await _feeService.IsStudentCleared(schoolId, student.Id, termId);
            if (!isCleared)
            {
                return ApiResponse<StudentResultCheckResponse>.SuccessResponse(new StudentResultCheckResponse
                {
                    IsFeesCleared = false,
                    Message = "Your fees have not been cleared for this term. Please contact the school administration.",
                    Result = null
                }, "Fee clearance required.");
            }

            // Get the full result
            var fullResult = await GetStudentResult(schoolId, student.Id, termId);

            return ApiResponse<StudentResultCheckResponse>.SuccessResponse(new StudentResultCheckResponse
            {
                IsFeesCleared = true,
                Message = "Result retrieved successfully.",
                Result = fullResult.Data
            }, "Result retrieved.");
        }
    }
}
