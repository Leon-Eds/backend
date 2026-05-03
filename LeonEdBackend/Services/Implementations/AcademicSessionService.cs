using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.SessionDtos;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class AcademicSessionService : IAcademicSessionService
    {
        private readonly AppDbContext _context;
        public AcademicSessionService(AppDbContext context) { _context = context; }

        public async Task<ApiResponse<List<SessionResponse>>> GetSessions(Guid schoolId)
        {
            var sessions = await _context.AcademicSessions.Where(s => s.SchoolId == schoolId)
                .Include(s => s.Terms).OrderByDescending(s => s.StartDate).ToListAsync();
            return ApiResponse<List<SessionResponse>>.SuccessResponse(sessions.Select(Map).ToList());
        }

        public async Task<ApiResponse<SessionResponse>> CreateSession(Guid schoolId, CreateSessionRequest request)
        {
            var session = new AcademicSession { Id = Guid.NewGuid(), SchoolId = schoolId, Name = request.Name, StartDate = request.StartDate, EndDate = request.EndDate, IsCurrent = false, CreatedAt = DateTime.UtcNow };
            _context.AcademicSessions.Add(session);
            await _context.SaveChangesAsync();
            return ApiResponse<SessionResponse>.SuccessResponse(Map(session), "Academic session created successfully.");
        }

        public async Task<ApiResponse<bool>> SetCurrentSession(Guid schoolId, Guid sessionId)
        {
            var sessions = await _context.AcademicSessions.Where(s => s.SchoolId == schoolId).ToListAsync();
            var target = sessions.FirstOrDefault(s => s.Id == sessionId);
            if (target == null) return ApiResponse<bool>.FailResponse("Session not found.");
            sessions.ForEach(s => s.IsCurrent = false);
            target.IsCurrent = true;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Current session set successfully.");
        }

        public async Task<ApiResponse<TermResponse>> CreateTerm(Guid schoolId, Guid sessionId, CreateTermRequest request)
        {
            var session = await _context.AcademicSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.SchoolId == schoolId);
            if (session == null) return ApiResponse<TermResponse>.FailResponse("Session not found.");
            if (await _context.Terms.AnyAsync(t => t.AcademicSessionId == sessionId && t.TermNumber == request.TermNumber))
                return ApiResponse<TermResponse>.FailResponse("This term already exists in the session.");

            var term = new Term { Id = Guid.NewGuid(), AcademicSessionId = sessionId, TermNumber = request.TermNumber, StartDate = request.StartDate, EndDate = request.EndDate, IsCurrent = false, CreatedAt = DateTime.UtcNow };
            _context.Terms.Add(term);
            await _context.SaveChangesAsync();
            return ApiResponse<TermResponse>.SuccessResponse(new TermResponse { Id = term.Id, TermNumber = term.TermNumber.ToString(), StartDate = term.StartDate, EndDate = term.EndDate, IsCurrent = term.IsCurrent }, "Term created successfully.");
        }

        public async Task<ApiResponse<bool>> SetCurrentTerm(Guid schoolId, Guid termId)
        {
            var term = await _context.Terms.Include(t => t.AcademicSession).FirstOrDefaultAsync(t => t.Id == termId && t.AcademicSession.SchoolId == schoolId);
            if (term == null) return ApiResponse<bool>.FailResponse("Term not found.");
            var allTerms = await _context.Terms.Where(t => t.AcademicSessionId == term.AcademicSessionId).ToListAsync();
            allTerms.ForEach(t => t.IsCurrent = false);
            term.IsCurrent = true;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.SuccessResponse(true, "Current term set successfully.");
        }

        private static SessionResponse Map(AcademicSession s) => new()
        { Id = s.Id, Name = s.Name, StartDate = s.StartDate, EndDate = s.EndDate, IsCurrent = s.IsCurrent, CreatedAt = s.CreatedAt, Terms = s.Terms?.OrderBy(t => t.TermNumber).Select(t => new TermResponse { Id = t.Id, TermNumber = t.TermNumber.ToString(), StartDate = t.StartDate, EndDate = t.EndDate, IsCurrent = t.IsCurrent }).ToList() ?? new() };
    }
}
