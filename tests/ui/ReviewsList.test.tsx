import React from 'react';
import { render, screen } from '@testing-library/react';
import ReviewsList from '../../components/ReviewsList';

describe('ReviewsList', () => {
  it('shows empty message when no reviews', () => {
    render(<ReviewsList reviews={[]} />);
    expect(screen.getByText('No reviews found.')).toBeInTheDocument();
  });

  it('renders a review missing title and version', () => {
    const review = { id: '1', author: 'Alice', content: 'Nice', rating: 5, date: new Date().toISOString() } as any;
    render(<ReviewsList reviews={[review]} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Nice')).toBeInTheDocument();
    // Version fallback em dash
    expect(screen.getByText(/Version:/)).toBeInTheDocument();
    expect(screen.getByText(/—/)).toBeInTheDocument();
    // Has list with aria-label
    expect(screen.getByLabelText('reviews-list')).toBeInTheDocument();
  });

  it('hides empty message while loading', () => {
    const { queryByText } = render(<ReviewsList reviews={[]} loading={true} />);
    expect(queryByText('No reviews found.')).toBeNull();
  });
});
