import {describe,expect,it} from "vitest";
import {assertTransition} from "./workflow";
describe("lead state machine",()=>{
 it("allows recruiter approval",()=>expect(()=>assertTransition("PENDING_REVIEW","APPROVED")).not.toThrow());
 it("rejects invalid transitions",()=>expect(()=>assertTransition("PENDING_REVIEW","CONTACTED")).toThrow(/Invalid status transition/));
 it("does not allow contact after STOP",()=>expect(()=>assertTransition("DO_NOT_CONTACT","CONTACT_READY")).toThrow());
});
