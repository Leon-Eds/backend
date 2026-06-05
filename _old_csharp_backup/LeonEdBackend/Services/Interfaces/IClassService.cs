using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ClassDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IClassService
    {
        Task<ApiResponse<List<ClassResponse>>> GetClasses(Guid schoolId);
        Task<ApiResponse<ClassResponse>> GetClassById(Guid schoolId, Guid classId);
        Task<ApiResponse<ClassResponse>> CreateClass(Guid schoolId, CreateClassRequest request);
        Task<ApiResponse<ClassResponse>> UpdateClass(Guid schoolId, Guid classId, UpdateClassRequest request);
        Task<ApiResponse<bool>> DeleteClass(Guid schoolId, Guid classId);
        Task<ApiResponse<ClassResponse>> AssignSubjectsToClass(Guid schoolId, Guid classId, AssignSubjectsToClassRequest request);
    }
}
