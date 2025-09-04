"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Quizz() {
  // ===== logic unchanged =====
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(10);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        const res = await axios.get("/api/quizzes");
        setQuizzes(res.data);
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
      }
    }
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (finished || quizzes.length === 0) return;
    if (timer === 0) {
      goToNextQuiz();
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, finished, quizzes]);

  useEffect(() => {
    if (finished) {
      async function postScore() {
        try {
          await axios.post("/api/scores", { gainedScore: score });
          console.log("Score updated successfully");
        } catch (error) {
          console.error("Error updating score:", error);
        }
      }
      postScore();
    }
  }, [finished, score]);

  function goToNextQuiz() {
    if (selected !== null && selected === quizzes[currentIndex].correct_index) {
      setScore((s) => s + 1);
    }
    if (currentIndex + 1 < quizzes.length) {
      setCurrentIndex((i) => i + 1);
      setTimer(10);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function handleSelect(index: number) {
    if (selected !== null) return;
    if (index === quizzes[currentIndex].correct_index) {
      setScore((s) => s + 1);
    }
    setSelected(index);
    setTimeout(goToNextQuiz, 1000);
  }
  // ===== /logic unchanged =====

  const total = 10;
  const progress = Math.max(0, Math.min(100, (timer / total) * 100));

  // Loading
  if (quizzes.length === 0) {
    return (
      <Card className="w-full max-w-xl mx-auto border-border bg-background/85 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Badge variant="secondary" className="text-xs">Loading…</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Progress value={50} />
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    return (
      <Card className="w-full max-w-xl mx-auto border-border bg-background/90 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quiz Completed!</h2>
            <Badge variant="secondary">{score} / {quizzes.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Your score has been saved. 🎉
        </CardContent>
      </Card>
    );
  }

  const quiz = quizzes[currentIndex];

  return (
    <Card className="w-full max-w-xl mx-auto border-border bg-background/85 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quizzes.length}
          </span>
          <Badge variant="secondary" className="text-xs">{timer}s left</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-center text-lg font-medium leading-relaxed break-words">
          {quiz.question}
        </p>

        <Progress value={progress} />
        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          {quiz.choices.map((option: string, i: number) => {
            const isSelected = selected === i;
            const isCorrect = quiz.correct_index === i;

        
            let classes =
              "w-full h-auto min-h-12 px-4 py-3 text-left whitespace-normal break-words " +
              "rounded-lg text-sm transition-colors";

            if (selected === null) {
              classes += " bg-muted hover:bg-accent";
            } else if (isSelected) {
              classes += isCorrect ? " bg-green-500 text-white" : " bg-red-500 text-white";
            } else {
              classes += " bg-muted text-foreground/80";
            }

            return (
              <Button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={classes}
                variant="secondary"
              >
                {option}
              </Button>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Score: {score}</span>
        <span>Auto‑next on select / timeout</span>
      </CardFooter>
    </Card>
  );
}
