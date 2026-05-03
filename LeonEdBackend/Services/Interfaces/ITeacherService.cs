using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.TeacherDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface ITeacherService
    {
        Task<ApiResponse<PagedResult<TeacherResponse>>> GetTeachers(Guid schoolId, PaginationParams paginationParams);
        Task<ApiResponse<TeacherResponse>> GetTeacherById(Guid schoolId, Guid teacherId);
        Task<ApiResponse<TeacherResponse>> CreateTeacher(Guid schoolId, CreateTeacherRequest request);
        Task<ApiResponse<TeacherResponse>> UpdateTeacher(Guid schoolId, Guid teacherId, UpdateTeacherRequest request);
        Task<ApiResponse<bool>> UpdateTeacherStatus(Guid schoolId, Guid teacherId, bool isActive);
        Task<ApiResponse<TeacherAssignmentResponse>> AssignTeacher(Guid schoolId, Guid teacherId, AssignTeacherRequest request);
        Task<ApiResponse<bool>> RemoveAssignment(Guid schoolId, Guid assignmentId);
    }
}
