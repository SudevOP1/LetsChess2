const footerLinks = [
  {
    title: "About",
    url: "#",
  },
  {
    title: "Contact",
    url: "#",
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-slate-800 bg-background/80 backdrop-blur-md py-6 md:py-0">
      <div className="mx-auto px-8 min-h-[4rem] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        <p className="text-sm md:text-md text-text-strong text-center md:text-left">
          &copy; {new Date().getFullYear()} LetsChess2. All rights reserved.
        </p>
        <p className="text-sm md:text-md text-text-text-strong text-center">
          Made with ❤️ by{" "}
          <a
            href="https://www.sudev.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold underline cursor-pointer hover:text-primary-hover"
          >
            Sudev
          </a>
        </p>
        <div className="flex items-center space-x-6">
          {footerLinks.map((footerLink) => (
            <a
              key={footerLink.title}
              href={footerLink.url}
              className="text-sm md:text-md text-text-strong hover:text-primary hover:underline"
            >
              {footerLink.title}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
