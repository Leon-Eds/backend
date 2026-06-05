using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ResultDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IResultService
    {
        Task<ApiResponse<ClassResultSummaryResponse>> ComputeClassResults(Guid schoolId, Guid classId, Guid termId);
        Task<ApiResponse<bool>> SubmitResults(Guid schoolId, Guid classId, Guid termId, SubmitResultRequest request);
        Task<ApiResponse<bool>> ApproveResults(Guid schoolId, Guid classId, Guid termId, ApproveResultRequest request);
        Task<ApiResponse<bool>> PublishResults(Guid schoolId, Guid classId, Guid termId);
        Task<ApiResponse<ClassResultSummaryResponse>> GetClassResults(Guid schoolId, Guid classId, Guid termId);
        Task<ApiResponse<StudentResultResponse>> GetStudentResult(Guid schoolId, Guid studentId, Guid termId);
        Task<ApiResponse<StudentResultCheckResponse>> CheckMyResult(Guid schoolId, Guid userId, Guid termId);
    }
}
