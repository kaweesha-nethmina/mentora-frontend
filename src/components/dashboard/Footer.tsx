export default function Footer() {
  return (
    <footer className="w-full border-t border-border">
      <div className="max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] mx-auto px-4 md:px-8 2xl:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs 2xl:text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Mentora</span>
          <span aria-hidden="true" className="mx-2 text-border-strong">/</span>
          Multi-agent tutoring for Java learners, R26-SE-030 at SLIIT
        </p>
        <nav className="flex gap-5" aria-label="Footer">
          <a href="#" className="hover:text-primary transition-colors">Help</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="https://mentora-website.kaweesha.com/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Research site</a>
        </nav>
      </div>
    </footer>
  );
}
