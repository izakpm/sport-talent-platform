import CoachWorkspace from "../CoachWorkspace";
import SessionInvitations from "../../athlete/calendar/SessionInvitations";
export default function CoachSchedulePage() {
  return (
    <>
      <SessionInvitations />
      <CoachWorkspace mode="schedule" />
    </>
  );
}
