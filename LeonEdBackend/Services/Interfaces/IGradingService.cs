using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.GradingDtos;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IGradingService
    {
        Task<ApiResponse<List<GradingRuleResponse>>> SetGradingRules(Guid schoolId, BulkCreateGradingRulesRequest request);
        Task<ApiResponse<List<GradingRuleResponse>>> GetGradingRules(Guid schoolId);
        Task<Grade> GetGrade(Guid schoolId, decimal score);
        Task<string> GetRemark(Guid schoolId, decimal score);
    }
}
