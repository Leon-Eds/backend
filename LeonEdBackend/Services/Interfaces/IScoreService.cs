using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.ScoreDtos;

namespace LeonEdBackend.Services.Interfaces
{
    public interface IScoreService
    {
        Task<ApiResponse<ScoreResponse>> EnterScore(Guid schoolId, Guid teacherId, EnterScoreRequest request);
        Task<ApiResponse<List<ScoreResponse>>> BulkEnterScores(Guid schoolId, Guid teacherId, BulkEnterScoresRequest request);
        Task<ApiResponse<ClassScoreSheetResponse>> GetClassScoreSheet(Guid schoolId, Guid classId, Guid subjectId, Guid termId);
        Task<ApiResponse<List<ScoreResponse>>> GetStudentScores(Guid schoolId, Guid studentId, Guid termId);
    }
}
