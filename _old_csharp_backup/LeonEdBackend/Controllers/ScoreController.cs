using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.ScoreDtos;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class ScoreController : BaseController
    {
        private readonly IScoreService _scoreService;
        private readonly AppDbContext _context;

        public ScoreController(IScoreService scoreService, AppDbContext context)
        {
            _scoreService = scoreService;
            _context = context;
        }

        /// <summary>Enter score for a single student+subject</summary>
        [HttpPost("enter")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> EnterScore([FromBody] EnterScoreRequest request)
        {
            var schoolId = RequireSchoolId();
            var teacherId = await GetTeacherId();
            var result = await _scoreService.EnterScore(schoolId, teacherId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Bulk enter scores for all students in a class for one subject</summary>
        [HttpPost("bulk-enter")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> BulkEnterScores([FromBody] BulkEnterScoresRequest request)
        {
            var schoolId = RequireSchoolId();
            var teacherId = await GetTeacherId();
            var result = await _scoreService.BulkEnterScores(schoolId, teacherId, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get score sheet for a class+subject+term</summary>
        [HttpGet("class/{classId}/subject/{subjectId}/term/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetClassScoreSheet(Guid classId, Guid subjectId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _scoreService.GetClassScoreSheet(schoolId, classId, subjectId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>Get all scores for a student in a term</summary>
        [HttpGet("student/{studentId}/term/{termId}")]
        [Authorize(Roles = "SchoolAdmin,Teacher")]
        public async Task<IActionResult> GetStudentScores(Guid studentId, Guid termId)
        {
            var schoolId = RequireSchoolId();
            var result = await _scoreService.GetStudentScores(schoolId, studentId, termId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        private async Task<Guid> GetTeacherId()
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId);
            return teacher?.Id ?? Guid.Empty;
        }
    }
}
