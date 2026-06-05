using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.SchoolDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class SchoolController : BaseController
    {
        private readonly ISchoolService _schoolService;
        public SchoolController(ISchoolService schoolService) { _schoolService = schoolService; }

        /// <summary>Get all schools (SuperAdmin only)</summary>
        [HttpGet]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAll([FromQuery] PaginationParams paginationParams)
        {
            var result = await _schoolService.GetAllSchools(paginationParams);
            return Ok(result);
        }

        /// <summary>Get school details</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            // School admins can only see their own school
            if (GetUserRole() != "SuperAdmin" && GetSchoolId() != id)
                return Forbid();
            var result = await _schoolService.GetSchoolById(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        /// <summary>Update school details</summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSchoolRequest request)
        {
            if (GetUserRole() != "SuperAdmin" && GetSchoolId() != id) return Forbid();
            var result = await _schoolService.UpdateSchool(id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Change school subscription plan (SuperAdmin only)</summary>
        [HttpPut("{id}/plan")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> UpdatePlan(Guid id, [FromBody] UpdateSchoolPlanRequest request)
        {
            var result = await _schoolService.UpdateSchoolPlan(id, request.SubscriptionPlan);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Activate or suspend a school (SuperAdmin only)</summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] bool isActive)
        {
            var result = await _schoolService.UpdateSchoolStatus(id, isActive);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get available subscription plans</summary>
        [HttpGet("plans")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _schoolService.GetSubscriptionPlans();
            return Ok(ApiResponse<List<SubscriptionPlanInfo>>.SuccessResponse(plans));
        }
    }
}
