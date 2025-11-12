"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Library, Music, Play, Volume2, Zap, Smartphone, Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			{/* Hero Section */}
			<section className="container mx-auto px-4 py-16">
				<div className="text-center space-y-8 max-w-4xl mx-auto">
					<div className="space-y-4">
						<Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
							🎵 Sistema de Streaming Local
						</Badge>
						<h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
							StreamLocal
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
							Sua plataforma completa de streaming de áudio com processamento automático, 
							múltiplas qualidades e interface moderna
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
						<Link href="/upload">
							<Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-3">
								<Upload className="w-5 h-5" />
								Começar Upload
							</Button>
						</Link>
						<Link href="/media">
							<Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-lg px-8 py-3">
								<Library className="w-5 h-5" />
								Explorar Biblioteca
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="container mx-auto px-4 pb-16">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Music className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Player Completo</CardTitle>
							<CardDescription>
								Interface moderna com controles avançados, seek preciso e visualização de forma de onda
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Settings className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Múltiplas Qualidades</CardTitle>
							<CardDescription>
								Processamento automático em 96k, 160k e 320k para otimizar experiência e largura de banda
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Zap className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Streaming Híbrido</CardTitle>
							<CardDescription>
								Combinação inteligente de arquivo completo e segmentos para máxima performance
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Library className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Biblioteca Organizada</CardTitle>
							<CardDescription>
								Dashboard intuitivo para navegar, pesquisar e gerenciar toda sua coleção musical
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Smartphone className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Design Responsivo</CardTitle>
							<CardDescription>
								Interface adaptável que funciona perfeitamente em desktop, tablet e mobile
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
						<CardHeader className="pb-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
								<Volume2 className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Processamento em Background</CardTitle>
							<CardDescription>
								Upload e conversão automática com feedback em tempo real do progresso
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</section>

			{/* Tech Stack */}
			<section className="container mx-auto px-4 pb-16">
				<div className="text-center space-y-8 max-w-4xl mx-auto">
					<div className="space-y-4">
						<h2 className="text-3xl font-bold">Stack Tecnológica Moderna</h2>
						<p className="text-muted-foreground text-lg">
							Construído com as melhores tecnologias para performance e escalabilidade
						</p>
					</div>
					
					<div className="flex flex-wrap justify-center gap-3">
						{[
							"Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui",
							"Fastify", "FFmpeg", "PostgreSQL", "Prisma",
							"Docker", "nginx", "Turbo", "Bun"
						].map((tech) => (
							<Badge key={tech} variant="secondary" className="px-3 py-1.5 text-sm">
								{tech}
							</Badge>
						))}
					</div>
				</div>
			</section>

			{/* Quick Actions */}
			<section className="container mx-auto px-4 pb-16">
				<Card className="max-w-2xl mx-auto">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Pronto para começar?</CardTitle>
						<CardDescription className="text-lg">
							Faça upload da sua primeira música ou explore as funcionalidades
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<Link href="/upload">
								<Button variant="default" size="lg" className="w-full gap-2">
									<Upload className="w-4 h-4" />
									Upload de Música
								</Button>
							</Link>
							<Link href="/media">
								<Button variant="outline" size="lg" className="w-full gap-2">
									<Play className="w-4 h-4" />
									Ver Biblioteca
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
