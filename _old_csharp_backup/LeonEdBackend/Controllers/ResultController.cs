using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.ResultDtos;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class ResultController : BaseController
    {
        private readonly IResultService _resultService;

        public ResultController(IResultService resultService)
        {
            _resultService = resultService;
        }

        /// <summary>Compute/re-compute results for a class in a term</summary>
        [HttpPost("compute/{classId}/{termId}")]
        [Authorize(Roles = "SchoolAdmin")]
        public async Task<IActionResult> ComputeClassResults(Guid classId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.ComputeClassResults(schoolId, classId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Teacher submits results for approval</summary>
        [HttpPost("submit/{classId}/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> SubmitResults(Guid classId, Guid termId, [FromBody] SubmitResultRequest request)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.SubmitResults(schoolId, classId, termId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Admin approves or rejects submitted results</summary>
        [HttpPost("approve/{classId}/{termId}")]
        [Authorize(Roles = "SchoolAdmin")]
        public async Task<IActionResult> ApproveResults(Guid classId, Guid termId, [FromBody] ApproveResultRequest request)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.ApproveResults(schoolId, classId, termId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Admin publishes approved results (students can now view)</summary>
        [HttpPost("publish/{classId}/{termId}")]
        [Authorize(Roles = "SchoolAdmin")]
        public async Task<IActionResult> PublishResults(Guid classId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.PublishResults(schoolId, classId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get class results summary (admin/teacher view)</summary>
        [HttpGet("class/{classId}/term/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetClassResults(Guid classId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.GetClassResults(schoolId, classId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get individual student result (admin/teacher view)</summary>
        [HttpGet("student/{studentId}/term/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetStudentResult(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _resultService.GetStudentResult(schoolId, studentId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Student checks own result (fee clearance enforced)</summary>
        [HttpGet("my/term/{termId}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> CheckMyResult(Guid termId)
        {
            var schoolId = RequireSchoolId();
            var userId = GetUserId();
            var result = await _resultService.CheckMyResult(schoolId, userId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
