using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SchoolDtos;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Services.Interfaces
{
    public interface ISchoolService
    {
        Task<ApiResponse<PagedResult<SchoolResponse>>> GetAllSchools(PaginationParams paginationParams);
        Task<ApiResponse<SchoolResponse>> GetSchoolById(Guid id);
        Task<ApiResponse<SchoolResponse>> UpdateSchool(Guid id, UpdateSchoolRequest request);
        Task<ApiResponse<SchoolResponse>> UpdateSchoolPlan(Guid schoolId, SubscriptionPlan plan);
        Task<ApiResponse<bool>> UpdateSchoolStatus(Guid schoolId, bool isActive);
        Task<List<SubscriptionPlanInfo>> GetSubscriptionPlans();
    }
}
