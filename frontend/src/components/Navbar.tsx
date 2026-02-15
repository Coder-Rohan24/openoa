import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-deep-blue to-deep-blue/95 shadow-xl border-b border-teal/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col py-8">
          {/* Title and Subtitle */}
          <div className="text-center mb-6">
            <Link to="/" className="group">
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2 transition-all duration-300 group-hover:text-teal">
                OpenOA Cloud Analyst
              </h1>
              <p className="text-teal text-base font-medium tracking-wide">
                Wind Plant AEP Estimation Platform
              </p>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex justify-center gap-4">
            <Link
              to="/"
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                location.pathname === '/'
                  ? 'bg-gradient-to-r from-teal to-teal/90 text-white shadow-lg shadow-teal/30'
                  : 'text-white hover:bg-white/10 hover:text-teal'
              }`}
            >
              Home
            </Link>
            <Link
              to="/results"
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                location.pathname === '/results'
                  ? 'bg-gradient-to-r from-teal to-teal/90 text-white shadow-lg shadow-teal/30'
                  : 'text-white hover:bg-white/10 hover:text-teal'
              }`}
            >
              Results
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
