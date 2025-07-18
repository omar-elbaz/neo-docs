import {useState} from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        const res = await fetch("http://localhost:3001/auth/login", {
            method: "POST",
            headers: { "Content-Type": "applications/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        localStorage.setItem("token", data.token);
    };

    return (
        // TODO: finish return component
    )
}