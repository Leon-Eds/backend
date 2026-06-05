using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.SubjectDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public class SubjectController : BaseController
    {
        private readonly ISubjectService _subjectService;
        public SubjectController(ISubjectService subjectService) { _subjectService = subjectService; }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _subjectService.GetSubjects(RequireSchoolId());
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubjectRequest request)
        {
            var result = await _subjectService.CreateSubject(RequireSchoolId(), request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectRequest request)
        {
            var result = await _subjectService.UpdateSubject(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _subjectService.DeleteSubject(RequireSchoolId(), id);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
