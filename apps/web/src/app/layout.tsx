import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import { PlayerProvider } from "@/contexts/player-context";
import GlobalPlayer from "@/components/global-player";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "streamLocal",
	description: "streamLocal",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<PlayerProvider>
						<div className="grid grid-rows-[auto_1fr] h-svh">
							<Header />
							<div className="pb-32">{children}</div>
						</div>
						<GlobalPlayer />
					</PlayerProvider>
				</Providers>
			</body>
		</html>
	);
}
