using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SubjectDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface ISubjectService
    {
        Task<ApiResponse<List<SubjectResponse>>> GetSubjects(Guid schoolId);
        Task<ApiResponse<SubjectResponse>> CreateSubject(Guid schoolId, CreateSubjectRequest request);
        Task<ApiResponse<SubjectResponse>> UpdateSubject(Guid schoolId, Guid subjectId, UpdateSubjectRequest request);
        Task<ApiResponse<bool>> DeleteSubject(Guid schoolId, Guid subjectId);
    }
}
