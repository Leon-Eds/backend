using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.FeeDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IFeeService
    {
        Task<ApiResponse<FeePaymentResponse>> RecordPayment(Guid schoolId, RecordFeePaymentRequest request);
        Task<ApiResponse<FeePaymentResponse>> GetStudentFeeStatus(Guid schoolId, Guid studentId, Guid termId);
        Task<ApiResponse<ClassFeeOverviewResponse>> GetClassFeeOverview(Guid schoolId, Guid classId, Guid termId);
        Task<ApiResponse<FeePaymentResponse>> ClearStudent(Guid schoolId, Guid studentId, Guid termId, Guid clearedByUserId);
        Task<bool> IsStudentCleared(Guid schoolId, Guid studentId, Guid termId);
    }
}
