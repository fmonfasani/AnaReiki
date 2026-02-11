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
    { name: "Inicio", href: "/" },
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
            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight">
              <span className="text-primary-dark">ANA</span>{" "}
              <span className="text-text-main">MURAT</span>
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
              href="/login"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-text-main hover:text-primary-dark transition-all duration-300 px-5 py-2.5 border border-primary-dark/20 rounded-full hover:bg-primary/10 group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                person
              </span>
              Área Consultantes
            </Link>

            <Link
              href="https://wa.me/543584376502"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex bg-whatsapp hover:bg-whatsapp/90 text-white px-6 py-2.5 rounded-full font-display font-bold transition-all transform hover:scale-105 shadow-md shadow-whatsapp/20 items-center gap-2"
            >
              Contactame
              <span className="material-symbols-outlined text-sm">chat</span>
            </Link>

            {/* Mobile Menu Button - Structured Hamburger */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 z-[70] relative focus:outline-none"
              aria-label="Toggle menu"
            >
              <span
                className={`block w-6 h-0.5 bg-text-main transition-all duration-300 ease-out ${isOpen ? "rotate-45 translate-y-2" : "-translate-y-1"}`}
              />
              <span
                className={`block w-6 h-0.5 bg-text-main my-1 transition-all duration-300 ease-out ${isOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`block w-6 h-0.5 bg-text-main transition-all duration-300 ease-out ${isOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-[#1b1214] md:hidden flex flex-col w-screen h-screen"
          >
            {/* Close Button in Modal */}
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 p-4 text-text-main dark:text-white"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div className="flex flex-col items-center justify-center flex-grow py-20 px-8 overflow-y-auto">
              <nav className="flex flex-col items-center gap-10 w-full">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="font-display text-4xl font-medium text-text-main dark:text-white hover:text-primary-dark transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full flex flex-col items-center gap-6 mt-4"
                >
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 font-display text-3xl font-medium text-primary-dark hover:text-text-main transition-colors"
                  >
                    <span className="material-symbols-outlined text-3xl">
                      person
                    </span>
                    Área Consultantes
                  </Link>

                  <Link
                    href="https://wa.me/543584376502"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="bg-whatsapp text-white px-12 py-5 rounded-[2rem] font-display font-medium text-xl shadow-lg shadow-whatsapp/10 block text-center transform active:scale-95 transition-transform w-full max-w-[280px]"
                  >
                    Contactame
                  </Link>
                </motion.div>
              </nav>
            </div>

            {/* Logo at bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pb-12 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-dark text-xl">
                  spa
                </span>
                <span className="font-display font-medium tracking-[0.2em] text-[10px] uppercase text-primary-dark">
                  ANA MURAT
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
