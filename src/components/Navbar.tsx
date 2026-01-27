"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Servicios", href: "/servicios" },
    { name: "Filosofía", href: "/filosofia" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group z-50">
            <span className="material-symbols-outlined text-primary-dark text-2xl md:text-3xl group-hover:rotate-180 transition-transform duration-700">
              spa
            </span>
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight text-text-main">
              Ana Reiki
            </h2>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-text-light hover:text-primary-dark transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/contacto"
              className="hidden md:flex bg-primary hover:bg-primary-dark text-text-main px-6 py-2.5 rounded-full font-display font-bold transition-all transform hover:scale-105 shadow-md shadow-primary/20"
            >
              Reservar Sesión
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-text-main p-2 z-50 focus:outline-none"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-3xl">
                {isOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-background-light/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center gap-8"
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-4xl font-medium text-text-main active:text-primary-dark"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <Link
                  href="/contacto"
                  onClick={() => setIsOpen(false)}
                  className="bg-primary text-text-main px-10 py-4 rounded-full font-display font-bold text-xl shadow-xl shadow-primary/20"
                >
                  Reservar Sesión
                </Link>
              </motion.div>
            </nav>

            <div className="absolute bottom-12 flex flex-col items-center gap-4 text-text-light">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-dark">
                  spa
                </span>
                <span className="font-display font-bold tracking-widest text-xs uppercase">
                  Ana Reiki
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
