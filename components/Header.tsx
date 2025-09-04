import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-anahuac-gray p-4 shadow-lg flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <img 
          src="https://www.anahuac.mx/mayab/themes/custom/uam/logo.svg" 
          alt="Anáhuac Mayab Logo" 
          className="h-12 mr-4 filter invert"
        />
        <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
          Mayabus Dashboard
        </h1>
      </div>
    </header>
  );
};

export default Header;
