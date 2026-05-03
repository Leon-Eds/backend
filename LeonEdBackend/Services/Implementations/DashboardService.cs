using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.DashboardDtos;
using LeonEdBackend.DTOs.TeacherDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        public DashboardService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<SchoolDashboardResponse>> GetSchoolDashboard(Guid schoolId)
        {
            var school = await _context.Schools.FirstOrDefaultAsync(s => s.Id == schoolId);
            if (school == null) return ApiResponse<SchoolDashboardResponse>.FailResponse("School not found.");

            var currentSession = await _context.AcademicSessions.FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.IsCurrent);
            var currentTerm = currentSession != null ? await _context.Terms.FirstOrDefaultAsync(t => t.AcademicSessionId == currentSession.Id && t.IsCurrent) : null;

            var response = new SchoolDashboardResponse
            {
                SchoolId = school.Id,
                SchoolName = school.Name,
                SubscriptionPlan = school.SubscriptionPlan.ToString(),
                TotalStudents = await _context.Students.CountAsync(s => s.SchoolId == schoolId && s.Status == StudentStatus.Active),
                TotalTeachers = await _context.Teachers.CountAsync(t => t.SchoolId == schoolId && t.IsActive),
                TotalClasses = await _context.Classes.CountAsync(c => c.SchoolId == schoolId),
                TotalSubjects = await _context.Subjects.CountAsync(s => s.SchoolId == schoolId),
                MaxStudents = school.MaxStudents,
                MaxTeachers = school.MaxTeachers,
                CurrentSession = currentSession?.Name,
                CurrentTerm = currentTerm?.TermNumber.ToString()
            };
            return ApiResponse<SchoolDashboardResponse>.SuccessResponse(response);
        }

        public async Task<ApiResponse<SuperAdminDashboardResponse>> GetSuperAdminDashboard()
        {
            var response = new SuperAdminDashboardResponse
            {
                TotalSchools = await _context.Schools.CountAsync(),
                ActiveSchools = await _context.Schools.CountAsync(s => s.IsActive),
                SuspendedSchools = await _context.Schools.CountAsync(s => !s.IsActive),
                TotalStudentsAcrossSchools = await _context.Students.CountAsync(s => s.Status == StudentStatus.Active),
                TotalTeachersAcrossSchools = await _context.Teachers.CountAsync(t => t.IsActive),
                PlanBreakdown = new PlanBreakdown
                {
                    FreeSchools = await _context.Schools.CountAsync(s => s.SubscriptionPlan == SubscriptionPlan.Free),
                    PlusSchools = await _context.Schools.CountAsync(s => s.SubscriptionPlan == SubscriptionPlan.Plus),
                    PremiumSchools = await _context.Schools.CountAsync(s => s.SubscriptionPlan == SubscriptionPlan.Premium)
                }
            };
            return ApiResponse<SuperAdminDashboardResponse>.SuccessResponse(response);
        }

        public async Task<ApiResponse<TeacherDashboardResponse>> GetTeacherDashboard(Guid schoolId, Guid userId)
        {
            var teacher = await _context.Teachers
                .Include(t => t.SubjectAssignments)
                    .ThenInclude(a => a.Subject)
                .Include(t => t.SubjectAssignments)
                    .ThenInclude(a => a.Class)
                .FirstOrDefaultAsync(t => t.UserId == userId && t.SchoolId == schoolId);

            if (teacher == null) return ApiResponse<TeacherDashboardResponse>.FailResponse("Teacher profile not found.");

            var currentSession = await _context.AcademicSessions.FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.IsCurrent);
            var currentTerm = currentSession != null ? await _context.Terms.FirstOrDefaultAsync(t => t.AcademicSessionId == currentSession.Id && t.IsCurrent) : null;

            var assignments = teacher.SubjectAssignments.Select(a => new TeacherAssignmentResponse
            {
                Id = a.Id,
                SubjectId = a.SubjectId,
                SubjectName = a.Subject?.Name ?? "",
                ClassId = a.ClassId,
                ClassName = a.Class != null ? $"{a.Class.Name} {a.Class.Arm}".Trim() : ""
            }).ToList();

            var response = new TeacherDashboardResponse
            {
                TeacherId = teacher.Id,
                FullName = teacher.FullName,
                TotalAssignedSubjects = assignments.Select(a => a.SubjectId).Distinct().Count(),
                TotalAssignedClasses = assignments.Select(a => a.ClassId).Distinct().Count(),
                CurrentSession = currentSession?.Name,
                CurrentTerm = currentTerm?.TermNumber.ToString(),
                Assignments = assignments
            };

            return ApiResponse<TeacherDashboardResponse>.SuccessResponse(response);
        }

        public async Task<ApiResponse<StudentDashboardResponse>> GetStudentDashboard(Guid schoolId, Guid userId)
        {
            var student = await _context.Students
                .Include(s => s.Class)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);

            if (student == null) return ApiResponse<StudentDashboardResponse>.FailResponse("Student profile not found.");

            var currentSession = await _context.AcademicSessions.FirstOrDefaultAsync(s => s.SchoolId == schoolId && s.IsCurrent);
            var currentTerm = currentSession != null ? await _context.Terms.FirstOrDefaultAsync(t => t.AcademicSessionId == currentSession.Id && t.IsCurrent) : null;

            var response = new StudentDashboardResponse
            {
                StudentId = student.Id,
                FullName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                ClassName = student.Class?.Name,
                ClassArm = student.Class?.Arm,
                CurrentSession = currentSession?.Name,
                CurrentTerm = currentTerm?.TermNumber.ToString()
            };

            return ApiResponse<StudentDashboardResponse>.SuccessResponse(response);
        }
    }
}
