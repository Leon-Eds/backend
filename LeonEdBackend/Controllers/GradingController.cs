using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.GradingDtos;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class GradingController : BaseController
    {
        private readonly IGradingService _gradingService;

        public GradingController(IGradingService gradingService)
        {
            _gradingService = gradingService;
        }

        /// <summary>Set grading rules for the school (replaces existing rules)</summary>
        [HttpPost("rules")]
        [Authorize(Roles = "SchoolAdmin")]
        public async Task<IActionResult> SetGradingRules([FromBody] BulkCreateGradingRulesRequest request)
        {
            var schoolId = RequireSchoolId();
            var result = await _gradingService.SetGradingRules(schoolId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get grading rules (returns defaults if not configured)</summary>
        [HttpGet("rules")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetGradingRules()
        {
            var schoolId = RequireSchoolId();
            var result = await _gradingService.GetGradingRules(schoolId);
            return Ok(result);
        }
    }
}
