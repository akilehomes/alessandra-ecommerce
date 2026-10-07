import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-16 mt-20">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div>
          <h4 className="text-white font-semibold tracking-wide mb-4 text-xs uppercase">SHOP</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-white transition">Novos Produtos</a></li>
            <li><a href="#" className="hover:text-white transition">Bestsellers</a></li>
            <li><a href="#" className="hover:text-white transition">Coleção</a></li>
            <li><a href="#" className="hover:text-white transition">Sale</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold tracking-wide mb-4 text-xs uppercase">STUDIO</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link to="/projects" className="hover:text-white transition">Projects</Link></li>
            <li><a href="#" className="hover:text-white transition">Partnerships</a></li>
            <li><a href="#" className="hover:text-white transition">Consultoria</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold tracking-wide mb-4 text-xs uppercase">SUPPORT</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#" className="hover:text-white transition">Contact</a></li>
            <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            <li><Link to="/legal/envio" className="hover:text-white transition">Política de envio</Link></li>
            <li><Link to="/legal/trocas" className="hover:text-white transition">Trocas e devoluções</Link></li>
            <li><Link to="/track" className="hover:text-white transition">Acompanhar pedido</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold tracking-wide mb-4 text-xs uppercase">LEGAL</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/legal/privacidade" className="hover:text-white transition">Política de privacidade</Link></li>
            <li><Link to="/legal/termos" className="hover:text-white transition">Termos de uso</Link></li>
            <li><Link to="/legal/envio" className="hover:text-white transition">Informações de envio</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8 max-w-6xl mx-auto px-6 flex justify-between items-center text-xs">
        <p>&copy; 2026 Alessandra Zanetti. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition">Instagram</a>
          <a href="#" className="hover:text-white transition">Pinterest</a>
          <a href="#" className="hover:text-white transition">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
