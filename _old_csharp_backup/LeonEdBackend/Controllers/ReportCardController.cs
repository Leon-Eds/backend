using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class ReportCardController : BaseController
    {
        private readonly IReportCardService _reportCardService;
        private readonly IFeeService _feeService;
        private readonly AppDbContext _context;

        public ReportCardController(IReportCardService reportCardService, IFeeService feeService, AppDbContext context)
        {
            _reportCardService = reportCardService;
            _feeService = feeService;
            _context = context;
        }

        /// <summary>Get report card data (JSON) for a student</summary>
        [HttpGet("{studentId}/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetReportCard(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _reportCardService.GenerateReportCard(schoolId, studentId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Download report card as PDF</summary>
        [HttpGet("{studentId}/{termId}/pdf")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> DownloadReportCardPdf(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _reportCardService.GenerateReportCardPdf(schoolId, studentId, termId);

            if (!result.Success || result.Data == null)
                return BadRequest(result);

            return File(result.Data, "application/pdf", $"report_card_{studentId}_{termId}.pdf");
        }

        /// <summary>Student downloads own report card PDF (fee clearance enforced)</summary>
        [HttpGet("my/{termId}/pdf")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> DownloadMyReportCard(Guid termId)
        {
            var schoolId = RequireSchoolId();
            var userId = GetUserId();

            // Find student from user
            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SchoolId == schoolId);
            if (student == null)
                return BadRequest(new { Success = false, Message = "Student profile not found." });

            // Check fee clearance
            var isCleared = await _feeService.IsStudentCleared(schoolId, student.Id, termId);
            if (!isCleared)
                return BadRequest(new { Success = false, Message = "Your fees have not been cleared for this term. Please contact the school administration." });

            var result = await _reportCardService.GenerateReportCardPdf(schoolId, student.Id, termId);

            if (!result.Success || result.Data == null)
                return BadRequest(result);

            return File(result.Data, "application/pdf", $"my_report_card_{termId}.pdf");
        }
    }
}
