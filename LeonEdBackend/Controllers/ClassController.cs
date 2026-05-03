using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LeonEdBackend.DTOs.ClassDtos;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,SchoolAdmin")]
    public class ClassController : BaseController
    {
        private readonly IClassService _classService;
        public ClassController(IClassService classService) { _classService = classService; }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _classService.GetClasses(RequireSchoolId());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _classService.GetClassById(RequireSchoolId(), id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClassRequest request)
        {
            var result = await _classService.CreateClass(RequireSchoolId(), request);
            return result.Success ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result) : BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassRequest request)
        {
            var result = await _classService.UpdateClass(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _classService.DeleteClass(RequireSchoolId(), id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/subjects")]
        public async Task<IActionResult> AssignSubjects(Guid id, [FromBody] AssignSubjectsToClassRequest request)
        {
            var result = await _classService.AssignSubjectsToClass(RequireSchoolId(), id, request);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
