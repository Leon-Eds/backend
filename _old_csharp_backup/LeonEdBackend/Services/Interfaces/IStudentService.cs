using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.StudentDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IStudentService
    {
        Task<ApiResponse<PagedResult<StudentResponse>>> GetStudents(Guid schoolId, PaginationParams paginationParams);
        Task<ApiResponse<StudentResponse>> GetStudentById(Guid schoolId, Guid studentId);
        Task<ApiResponse<StudentResponse>> CreateStudent(Guid schoolId, CreateStudentRequest request);
        Task<ApiResponse<StudentResponse>> UpdateStudent(Guid schoolId, Guid studentId, UpdateStudentRequest request);
        Task<ApiResponse<bool>> DeleteStudent(Guid schoolId, Guid studentId);
        Task<ApiResponse<List<StudentResponse>>> SearchStudents(Guid schoolId, string query);
    }
}
