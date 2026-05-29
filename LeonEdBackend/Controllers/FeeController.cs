using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.FeeDtos;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SchoolAdmin")]
    public class FeeController : BaseController
    {
        private readonly IFeeService _feeService;

        public FeeController(IFeeService feeService)
        {
            _feeService = feeService;
        }

        /// <summary>Record a fee payment for a student</summary>
        [HttpPost("record")]
        public async Task<IActionResult> RecordPayment([FromBody] RecordFeePaymentRequest request)
        {
            var schoolId = RequireSchoolId();
            var result = await _feeService.RecordPayment(schoolId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Manually clear a student's fees for a term</summary>
        [HttpPost("clear/{studentId}/{termId}")]
        public async Task<IActionResult> ClearStudent(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var userId = GetUserId();
            var result = await _feeService.ClearStudent(schoolId, studentId, termId, userId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Check fee status for a student in a term</summary>
        [HttpGet("student/{studentId}/term/{termId}")]
        public async Task<IActionResult> GetStudentFeeStatus(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _feeService.GetStudentFeeStatus(schoolId, studentId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get fee overview for all students in a class for a term</summary>
        [HttpGet("class/{classId}/term/{termId}")]
        public async Task<IActionResult> GetClassFeeOverview(Guid classId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _feeService.GetClassFeeOverview(schoolId, classId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
