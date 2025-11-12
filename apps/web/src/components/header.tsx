"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Upload, Library, Home } from "lucide-react";

export default function Header() {
	const links = [
		{ to: "/", label: "Home", icon: Home },
		{ to: "/media", label: "Biblioteca", icon: Library },
		{ to: "/upload", label: "Upload", icon: Upload },
	] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-3">
				<div className="flex items-center gap-2">
					<Link href="/" className="text-xl font-bold">
						StreamLocal
					</Link>
				</div>
				
				<nav className="flex gap-2">
					{links.map(({ to, label, icon: Icon }) => {
						return (
							<Link key={to} href={to}>
								<Button variant="ghost" size="sm" className="gap-2">
									<Icon className="h-4 w-4" />
									{label}
								</Button>
							</Link>
						);
					})}
				</nav>
				
				<div className="flex items-center gap-2">
					<ModeToggle />
				</div>
			</div>
			<hr />
		</div>
	);
}
