using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SessionDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IAcademicSessionService
    {
        Task<ApiResponse<List<SessionResponse>>> GetSessions(Guid schoolId);
        Task<ApiResponse<SessionResponse>> CreateSession(Guid schoolId, CreateSessionRequest request);
        Task<ApiResponse<bool>> SetCurrentSession(Guid schoolId, Guid sessionId);
        Task<ApiResponse<TermResponse>> CreateTerm(Guid schoolId, Guid sessionId, CreateTermRequest request);
        Task<ApiResponse<bool>> SetCurrentTerm(Guid schoolId, Guid termId);
    }
}
