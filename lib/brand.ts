/**
 * The Assay mark, as one shared definition.
 *
 * The geometry is traced directly from the supplied artwork rather than
 * redrawn — every vertex comes from the source file's own pixels, verified at
 * 99.6% pixel agreement against it (the remainder is the antialiasing fringe on
 * the diagonals, nothing structural).
 *
 * It lives here, not in the component, because the OG image renders in Satori
 * and can't import React components. Previously each kept its own copy of the
 * paths and they drifted. One export, both consumers.
 *
 * Filled with `evenodd`: the mark is a single outline with six counters punched
 * through it, and nonzero winding would fill them in.
 */
export const MARK_VIEWBOX = "0 0 24 24";

export const MARK_PATH =
  "M0 1.021 L10.259 1.021 L12.766 4.967 L12.859 4.967 L16.758 1.021 L24 1.021 L24 22.979 L21.493 22.979 L19.172 19.497 L18.847 18.894 L16.897 16.015 L16.573 16.34 L16.573 16.433 L16.48 16.433 L16.48 16.526 L10.12 22.979 L0 22.979Z" +
  "M4.364 3.574 L8.681 8.449 L8.913 8.681 L8.913 8.774 L9.006 8.774 L10.956 6.824 L8.913 3.574Z" +
  "M17.779 3.574 L14.251 7.103 L14.251 7.242 L14.716 7.845 L14.762 8.031 L15.226 8.634 L15.273 8.82 L16.015 9.934 L16.99 11.327 L17.315 11.93 L17.455 11.93 L17.733 11.652 L17.733 11.559 L21.447 7.845 L21.447 3.574Z" +
  "M2.553 5.524 L2.553 15.087 L2.646 15.087 L7.103 10.631 L7.056 10.445 L6.685 10.12 L6.685 10.027 L6.313 9.702 L6.313 9.609 L5.942 9.284 L5.942 9.191 L5.617 8.913 L5.617 8.82 L5.246 8.495 L5.246 8.402 L4.828 8.031 L4.828 7.938 L4.456 7.613 L4.456 7.52 L4.085 7.195 L4.085 7.103 L3.667 6.731 L3.667 6.638 L3.296 6.313 L3.296 6.221 L2.646 5.524Z" +
  "M12.302 9.006 L12.302 9.099 L10.723 10.584 L10.723 10.723 L13.973 14.391 L14.391 14.809 L14.391 14.901 L14.484 14.901 L15.505 13.834 L12.395 9.006Z" +
  "M21.354 11.513 L20.472 12.395 L20.472 12.487 L18.986 13.926 L18.986 14.019 L18.801 14.159 L18.847 14.298 L19.683 15.458 L19.729 15.644 L20.193 16.34 L20.333 16.433 L20.379 16.619 L21.308 18.012 L21.447 18.104 L21.447 11.513Z" +
  "M8.867 12.487 L2.6 18.662 L2.553 20.426 L9.052 20.426 L9.563 19.868 L12.627 16.805 L12.627 16.665 L12.255 16.34 L12.255 16.248 L11.838 15.876 L11.838 15.783 L11.466 15.458 L11.466 15.366 L11.141 15.087 L11.141 14.994 L10.723 14.623 L10.723 14.53 L8.867 12.534Z";
