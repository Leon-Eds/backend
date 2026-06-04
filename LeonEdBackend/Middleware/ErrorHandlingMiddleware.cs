using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace LeonEdBackend.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ErrorHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (UnauthorizedAccessException ex)
            {
                await WriteProblemDetailsAsync(context, HttpStatusCode.Unauthorized, "Unauthorized", ex.Message);
            }
            catch (Exception ex)
            {
                await WriteProblemDetailsAsync(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.", ex.Message);
            }
        }

        private static Task WriteProblemDetailsAsync(HttpContext context, HttpStatusCode statusCode, string title, string detail)
        {
            var problemDetails = new
            {
                type = "about:blank",
                title,
                status = (int)statusCode,
                detail
            };

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)statusCode;
            return context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
        }
    }

    public static class ErrorHandlingMiddlewareExtensions
    {
        public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ErrorHandlingMiddleware>();
        }
    }
}
