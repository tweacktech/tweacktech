import { useEffect } from 'react';
import { setSeo } from '../lib/seo';

/** Keeps document head metadata in sync with a route's data. */
export const useSeo = (options = {}) => {
  const signature = JSON.stringify(options);
  useEffect(() => {
    setSeo(JSON.parse(signature));
  }, [signature]);
};

export default useSeo;
