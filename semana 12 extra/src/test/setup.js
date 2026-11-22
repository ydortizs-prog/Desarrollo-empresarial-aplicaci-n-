import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// A waiting query gives up after 300 ms: the tests never sleep for real (the simulated network answers only when the
// test releases the request), so a failing test fails fast instead of hanging.
configure({ asyncUtilTimeout: 300 });
