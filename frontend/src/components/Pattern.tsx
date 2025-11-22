'use client';

import React from 'react';
import styled from 'styled-components';

const Pattern = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1; // Ensure it stays in the background

  .container {
    width: 100%;
    height: 100%;
    background-color: black;
  }
`;

export default Pattern;
