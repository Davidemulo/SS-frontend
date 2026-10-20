import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FundingProgressBar, fundingThresholdState } from "../FundingProgressBar";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

function advanceAnimation() {
    act(() => {
        vi.advanceTimersByTime(200);
    });
}

describe("FundingProgressBar", () => {
    it("renders the correct percentage for a partially funded invoice", () => {
        render(<FundingProgressBar raised={4500} target={10000} investorCount={3} />);
        advanceAnimation();

        expect(screen.getByText("45.0%")).toBeInTheDocument();
    });

    it("renders 100% when raised equals target", () => {
        render(<FundingProgressBar raised={10000} target={10000} investorCount={5} />);
        advanceAnimation();

        expect(screen.getByText("100.0%")).toBeInTheDocument();
    });

    it("caps at 100% when raised exceeds target", () => {
        render(<FundingProgressBar raised={15000} target={10000} investorCount={5} />);
        advanceAnimation();

        expect(screen.getByText("100.0%")).toBeInTheDocument();
    });

    it("renders green bar when 100% funded", () => {
        render(<FundingProgressBar raised={10000} target={10000} investorCount={5} />);
        advanceAnimation();

        const bar = screen.getByText("100.0%");
        expect(bar).toBeInTheDocument();
    });

    it("displays XLM raised and target below the bar", () => {
        render(<FundingProgressBar raised={4500} target={10000} investorCount={3} />);
        advanceAnimation();

        expect(screen.getByText("4,500 XLM of 10,000 XLM")).toBeInTheDocument();
    });

    it("formats total to 2 decimal places", () => {
        render(<FundingProgressBar raised={4500} target={10000} investorCount={3} />);
        advanceAnimation();

        const formattedText = screen.getByText("4,500 XLM of 10,000 XLM");
        expect(formattedText).toBeInTheDocument();
    });

    it("handles zero target gracefully", () => {
        render(<FundingProgressBar raised={0} target={0} investorCount={0} />);
        advanceAnimation();

        expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("renders Fully funded badge at 100%", () => {
        render(<FundingProgressBar raised={10000} target={10000} investorCount={3} />);
        advanceAnimation();

        expect(screen.getByText("Fully funded")).toBeInTheDocument();
    });

    it("does not render Fully funded badge at 99.9%", () => {
        render(<FundingProgressBar raised={9990} target={10000} investorCount={3} />);
        advanceAnimation();

        expect(screen.queryByText("Fully funded")).not.toBeInTheDocument();
    });

    it("renders singular 'investor' for count of 1", () => {
        render(<FundingProgressBar raised={5000} target={10000} investorCount={1} />);
        advanceAnimation();

        expect(screen.getByText("1 investor")).toBeInTheDocument();
    });

    it("renders plural 'investors' for count of 5", () => {
        render(<FundingProgressBar raised={5000} target={10000} investorCount={5} />);
        advanceAnimation();

        expect(screen.getByText("5 investors")).toBeInTheDocument();
    });

    it("renders '0 investors' without crashing", () => {
        render(<FundingProgressBar raised={0} target={10000} investorCount={0} />);
        advanceAnimation();

        expect(screen.getByText("0 investors")).toBeInTheDocument();
    });

    describe("min threshold and max cap (#462)", () => {
        it("renders raised against the max cap", () => {
            render(<FundingProgressBar raised={3000} target={10000} minThreshold={6000} investorCount={2} />);
            advanceAnimation();

            expect(screen.getByText("30.0%")).toBeInTheDocument();
            expect(screen.getByTestId("funding-progress-bar")).toHaveStyle({ width: "30%" });
        });

        it("positions the min threshold marker as a share of the cap", () => {
            render(<FundingProgressBar raised={3000} target={10000} minThreshold={6000} investorCount={2} />);

            expect(screen.getByTestId("funding-min-marker")).toHaveStyle({ left: "60%" });
        });

        it("labels raised, min threshold and max cap with their amounts", () => {
            render(<FundingProgressBar raised={3000} target={10000} minThreshold={6000} investorCount={2} />);

            expect(screen.getByTestId("funding-label-raised")).toHaveTextContent("3,000 XLM");
            expect(screen.getByTestId("funding-label-min")).toHaveTextContent("6,000 XLM");
            expect(screen.getByTestId("funding-label-max")).toHaveTextContent("10,000 XLM");
        });

        it("shows no badge below the minimum", () => {
            render(<FundingProgressBar raised={5999} target={10000} minThreshold={6000} investorCount={2} />);

            expect(screen.queryByTestId("funding-badge-min-met")).not.toBeInTheDocument();
            expect(screen.queryByTestId("funding-badge-fully-funded")).not.toBeInTheDocument();
        });

        it("shows Minimum met between the minimum and the cap", () => {
            render(<FundingProgressBar raised={6000} target={10000} minThreshold={6000} investorCount={2} />);

            expect(screen.getByText("Minimum met")).toBeInTheDocument();
            expect(screen.queryByText("Fully funded")).not.toBeInTheDocument();
        });

        it("shows only Fully funded once the cap is reached", () => {
            render(<FundingProgressBar raised={10000} target={10000} minThreshold={6000} investorCount={2} />);

            expect(screen.getByText("Fully funded")).toBeInTheDocument();
            expect(screen.queryByText("Minimum met")).not.toBeInTheDocument();
        });

        it("ignores a threshold outside the bar", () => {
            render(<FundingProgressBar raised={3000} target={10000} minThreshold={10000} investorCount={2} />);

            expect(screen.queryByTestId("funding-min-marker")).not.toBeInTheDocument();
            expect(screen.queryByTestId("funding-threshold-labels")).not.toBeInTheDocument();
        });

        it("classifies each funding state", () => {
            expect(fundingThresholdState(0, 10000, 6000)).toBe("below_min");
            expect(fundingThresholdState(7000, 10000, 6000)).toBe("min_met");
            expect(fundingThresholdState(10000, 10000, 6000)).toBe("fully_funded");
            expect(fundingThresholdState(7000, 10000, null)).toBe("below_min");
        });
    });
});
