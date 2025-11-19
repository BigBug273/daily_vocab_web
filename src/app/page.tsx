"use client";

import { useState, useEffect, useCallback } from "react";
import { Word, Difficulty } from "@/types";

export default function Home() {
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [sentence, setSentence] = useState("");
    const [score, setScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState("");
    const [corrected, setCorrected] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    // -----------------------
    // Fetch Random Word
    // -----------------------
    const getRandomWord = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:8000/api/word");
            const data = await res.json();
            setCurrentWord(data);

            // reset UI
            setSentence("");
            setScore(null);
            setFeedback("");
            setCorrected("");
            setIsSubmitted(false);
        } catch (err) {
            console.error("Error fetching random word:", err);
        }
    }, []);

    useEffect(() => {
        getRandomWord();
    }, [getRandomWord]);

    // -----------------------
    // Handle typing
    // -----------------------
    const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSentence(e.target.value);

        if (isSubmitted) {
            setIsSubmitted(false);
            setScore(null);
            setFeedback("");
            setCorrected("");
        }
    };

    // -----------------------
    // Validate Sentence API
    // -----------------------
    const validateSentence = async () => {
        const res = await fetch("http://localhost:8000/api/validate-sentence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                word_id: currentWord?.id,
                sentence: sentence,
            }),
        });

        if (!res.ok) throw new Error("Validation failed");

        return await res.json();
    };

    // -----------------------
    // Save to Database API
    // -----------------------
    const savePracticeSession = async (validationResult: any) => {
        await fetch("http://localhost:8000/api/practice-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                word_id: currentWord?.id,
                user_sentence: sentence,
                score: validationResult.score,
                feedback: validationResult.suggestion,
                corrected_sentence: validationResult.corrected_sentence,
            }),
        });
    };

    // -----------------------
    // Submit Sentence
    // -----------------------
    const handleSubmitSentence = async () => {
        if (!currentWord) return;

        try {
            const result = await validateSentence();

            setScore(result.score);
            setFeedback(result.suggestion);
            setCorrected(result.corrected_sentence);
            setIsSubmitted(true);

            // Save to DB
            await savePracticeSession(result);

        } catch (err) {
            console.error("Error submitting sentence:", err);
        }
    };

    // -----------------------
    // Retry
    // -----------------------
    const handleRetry = () => {
        setSentence("");
        setScore(null);
        setFeedback("");
        setCorrected("");
        setIsSubmitted(false);
    };

    // -----------------------
    // Next Word
    // -----------------------
    const handleNextWord = () => {
        getRandomWord();
    };

    // -----------------------
    // Difficulty Color Badge
    // -----------------------
    const getDifficultyColor = (difficulty: Difficulty) => {
        switch (difficulty) {
            case "Beginner":
                return "bg-green-200 text-green-800";
            case "Intermediate":
                return "bg-yellow-200 text-yellow-800";
            case "Advanced":
                return "bg-red-200 text-red-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };

    if (!currentWord) {
        return (
            <div className="flex justify-center items-center h-screen">
                Loading word...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800">
                Word Challenge
            </h1>

            <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-primary">
                        {currentWord.word}
                    </h2>
                    <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(
                            currentWord.difficulty_level
                        )}`}
                    >
                        {currentWord.difficulty_level}
                    </span>
                </div>

                <p className="text-lg text-gray-700 mb-6">
                    {currentWord.definition}
                </p>

                {/* Sentence Input */}
                <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg text-lg"
                    rows={4}
                    placeholder="Type your sentence..."
                    value={sentence}
                    onChange={handleSentenceChange}
                    disabled={isSubmitted}
                ></textarea>

                {/* Score + Buttons */}
                <div className="flex justify-between items-center mt-6">
                    {score !== null && (
                        <p className="text-xl font-bold">
                            Score: {score.toFixed(1)}
                        </p>
                    )}

                    <div className="flex gap-3">
                        {!isSubmitted ? (
                            <button
                                className="px-6 py-3 bg-primary text-white rounded-lg"
                                disabled={!sentence.trim()}
                                onClick={handleSubmitSentence}
                            >
                                Submit
                            </button>
                        ) : (
                            <>
                                <button
                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg"
                                    onClick={handleRetry}
                                >
                                    Retry
                                </button>
                                <button
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg"
                                    onClick={handleNextWord}
                                >
                                    Next Word
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Feedback & Correction */}
                {isSubmitted && (
                    <div className="mt-6">
                        <p className="font-semibold text-gray-800">
                            Feedback: {feedback}
                        </p>
                        <p className="mt-2 text-gray-700">
                            Corrected Sentence: {corrected}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
