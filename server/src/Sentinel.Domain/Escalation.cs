namespace Sentinel.Domain;

/// <summary>
/// The server's copy of a journey's plan (Phase 3): the expected minute, the
/// grace, and who to tell. Never the destination, which stays on the phone.
/// It fires when the phone has said nothing by the escalation minute.
/// </summary>
public static class Escalation
{
    public static long EscalateAt(long expectedMinutes, int graceMinutes) => expectedMinutes + graceMinutes;

    public static bool Due(long expectedMinutes, int graceMinutes, bool confirmed, bool cancelled, long nowMinutes)
        => !confirmed && !cancelled && nowMinutes >= EscalateAt(expectedMinutes, graceMinutes);
}
