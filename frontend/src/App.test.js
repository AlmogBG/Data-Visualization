import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App routing tests", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("redirects from root path to login page", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("כניסה למערכת")).toBeInTheDocument();
  });

  test("renders login page when navigating directly to /login", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("כניסה למערכת")).toBeInTheDocument();
  });

  test("redirects unknown route to login page", async () => {
    render(
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText("כניסה למערכת")).toBeInTheDocument();
  });
});