import React from 'react';
import IdeWorkspace from '../Component/IdeWorkspace';
import { useSeo } from '../Component/useSeo';

/**
 * A free, full-screen code workspace for everyone. No account, no payment and
 * no page reload: files, tabs and results live in one focused code mode.
 */
const IdePage = () => {
  useSeo({
    title: 'Free Code IDE — Write and Run Code in Your Browser',
    description:
      'A free multi-file online IDE. Write, run and debug JavaScript, TypeScript, Python, SQL, HTML, CSS, JSON, YAML, Markdown, PHP, Go, Bash, C, C++, Java, C#, Ruby and Rust in your browser. No account or payment required.',
    keywords:
      'free code IDE, online playground, multi file editor, JavaScript playground, Python IDE, SQL playground, learn to code',
    url: '/ide',
  });

  return <IdeWorkspace />;
};

export default IdePage;
