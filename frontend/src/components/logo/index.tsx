import { Link } from 'react-router-dom';

const Logo = (props: { url?: string }) => {
  const { url = '/' } = props;
  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>
        <img
          src="images/orbiit-logo.png"
          alt="Orbiit"
          className="inline-block w-[40px]"
        />
      </Link>
    </div>
  );
};

export default Logo;

