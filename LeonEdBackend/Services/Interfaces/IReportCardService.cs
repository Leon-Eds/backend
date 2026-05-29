using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ReportCardDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IReportCardService
    {
        Task<ApiResponse<ReportCardResponse>> GenerateReportCard(Guid schoolId, Guid studentId, Guid termId);
        Task<ApiResponse<byte[]>> GenerateReportCardPdf(Guid schoolId, Guid studentId, Guid termId);
    }
}
