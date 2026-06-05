using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.DashboardDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<ApiResponse<SchoolDashboardResponse>> GetSchoolDashboard(Guid schoolId);
        Task<ApiResponse<SuperAdminDashboardResponse>> GetSuperAdminDashboard();
        Task<ApiResponse<TeacherDashboardResponse>> GetTeacherDashboard(Guid schoolId, Guid userId);
        Task<ApiResponse<StudentDashboardResponse>> GetStudentDashboard(Guid schoolId, Guid userId);
    }
}
